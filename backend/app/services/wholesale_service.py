import random
import logging
from datetime import datetime, timezone, timedelta
from decimal import Decimal
from typing import List, Optional, Tuple, Dict, Any

from fastapi import HTTPException, status
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.wholesale import (
    RFQ,
    RFQItem,
    RFQStatusHistory,
    Quote,
    QuoteItem,
    RFQStatus,
    QuoteStatus,
)
from app.schemas.wholesale import (
    RFQCreateRequest,
    RFQItemCreate,
    RFQRevisionRequest,
    RFQStatusUpdateRequest,
    QuoteCreateRequest,
    QuoteUpdateRequest,
    QuoteRejectRequest,
)
from app.services.order_service import order_service

logger = logging.getLogger("hepna.services.wholesale")

RFQ_ALLOWED_TRANSITIONS: Dict[str, List[str]] = {
    "draft": ["submitted", "cancelled"],
    "submitted": ["under_review", "cancelled"],
    "under_review": ["quoted", "negotiating", "rejected", "cancelled"],
    "quoted": ["negotiating", "accepted", "rejected", "expired", "cancelled"],
    "negotiating": ["quoted", "accepted", "rejected", "expired", "cancelled"],
    "accepted": [],
    "rejected": [],
    "expired": [],
    "cancelled": [],
}

QUOTE_ALLOWED_TRANSITIONS: Dict[str, List[str]] = {
    "draft": ["sent", "cancelled"],
    "sent": ["negotiating", "accepted", "rejected", "expired", "cancelled"],
    "negotiating": ["sent", "accepted", "rejected", "expired", "cancelled"],
    "accepted": [],
    "rejected": [],
    "expired": [],
    "cancelled": [],
}


class WholesaleService:
    @staticmethod
    def generate_rfq_number() -> str:
        """
        Generate unique human-readable RFQ identifier.
        Format: RFQ-YYYYMMDD-XXXXXX
        """
        today_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        rand_suffix = random.randint(100000, 999999)
        return f"RFQ-{today_str}-{rand_suffix}"

    @staticmethod
    def generate_quote_number() -> str:
        """
        Generate unique human-readable Quote identifier.
        Format: QTE-YYYYMMDD-XXXXXX
        """
        today_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        rand_suffix = random.randint(100000, 999999)
        return f"QTE-{today_str}-{rand_suffix}"

    # =========================================================================
    # RFQ MANAGEMENT
    # =========================================================================

    def create_rfq(
        self,
        db: Session,
        user: User,
        rfq_in: RFQCreateRequest,
    ) -> RFQ:
        """
        Create a new institutional RFQ with historical product snapshots.
        """
        if not rfq_in.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="RFQ must include at least one material item.",
            )

        rfq_number = self.generate_rfq_number()
        initial_status = RFQStatus.SUBMITTED.value if rfq_in.submit_now else RFQStatus.DRAFT.value
        submitted_at = datetime.now(timezone.utc) if rfq_in.submit_now else None

        rfq = RFQ(
            rfq_number=rfq_number,
            user_id=user.id,
            project_id=rfq_in.project_id,
            project_name=rfq_in.project_name or rfq_in.delivery_address.site_name,
            project_type=rfq_in.project_type or rfq_in.delivery_address.site_type,
            required_by_date=rfq_in.required_by_date,
            delivery_address=rfq_in.delivery_address.model_dump(),
            gstin=rfq_in.gstin,
            notes=rfq_in.notes,
            status=initial_status,
            submitted_at=submitted_at,
        )
        db.add(rfq)
        db.flush()

        for item_in in rfq_in.items:
            product = None
            if item_in.product_id:
                product = db.scalar(select(Product).where(Product.id == item_in.product_id))

            rfq_item = RFQItem(
                rfq_id=rfq.id,
                product_id=product.id if product else item_in.product_id,
                product_name=item_in.product_name or (product.name if product else "Custom Material"),
                product_sku=item_in.product_sku or (product.slug if product else None),
                brand=item_in.brand or (product.brand if product else None),
                unit=item_in.unit or (product.unit if product else "Pieces"),
                requested_quantity=item_in.requested_quantity,
                target_unit_price=item_in.target_unit_price,
                notes=item_in.notes,
            )
            db.add(rfq_item)

        # Initial Status History Milestone
        milestone_title = "RFQ Submitted" if rfq_in.submit_now else "RFQ Draft Created"
        milestone_desc = (
            "Wholesale inquiry submitted for institutional sales engineering review."
            if rfq_in.submit_now
            else "RFQ draft created by customer."
        )
        history = RFQStatusHistory(
            rfq_id=rfq.id,
            old_status=None,
            new_status=initial_status,
            changed_by_user_id=user.id,
            title=milestone_title,
            description=milestone_desc,
        )
        db.add(history)

        db.commit()
        db.refresh(rfq)
        logger.info(f"Successfully created RFQ {rfq.rfq_number} (status={rfq.status}) for user {user.id}")
        return rfq

    def get_rfq(
        self,
        db: Session,
        rfq_id_or_number: str,
        user_id: Optional[str] = None,
        is_staff: bool = False,
    ) -> RFQ:
        """
        Fetch RFQ by ID or RFQ number. Enforces customer isolation.
        """
        rfq = db.scalar(
            select(RFQ).where(
                or_(RFQ.id == rfq_id_or_number, RFQ.rfq_number == rfq_id_or_number)
            )
        )
        if not rfq:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"RFQ '{rfq_id_or_number}' was not found.",
            )

        if not is_staff and user_id and rfq.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to view this RFQ.",
            )

        return rfq

    def list_user_rfqs(
        self,
        db: Session,
        user_id: str,
        skip: int = 0,
        limit: int = 50,
        status_filter: Optional[str] = None,
    ) -> Tuple[List[RFQ], int]:
        """
        List all RFQs for authenticated customer.
        """
        stmt = select(RFQ).where(RFQ.user_id == user_id)
        if status_filter:
            stmt = stmt.where(RFQ.status == status_filter)

        total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        items = db.scalars(
            stmt.order_by(RFQ.created_at.desc()).offset(skip).limit(limit)
        ).all()
        return list(items), total

    def list_admin_rfqs(
        self,
        db: Session,
        skip: int = 0,
        limit: int = 50,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
    ) -> Tuple[List[RFQ], int]:
        """
        List all institutional RFQs for procurement managers and administrators.
        """
        stmt = select(RFQ)
        if status_filter:
            stmt = stmt.where(RFQ.status == status_filter)
        if search:
            pattern = f"%{search}%"
            stmt = stmt.where(
                or_(
                    RFQ.rfq_number.ilike(pattern),
                    RFQ.project_name.ilike(pattern),
                    RFQ.gstin.ilike(pattern),
                )
            )

        total = db.scalar(select(func.count()).select_from(stmt.subquery())) or 0
        items = db.scalars(
            stmt.order_by(RFQ.created_at.desc()).offset(skip).limit(limit)
        ).all()
        return list(items), total

    def submit_rfq(
        self,
        db: Session,
        rfq_id: str,
        user_id: str,
    ) -> RFQ:
        """
        Transition an RFQ from DRAFT to SUBMITTED.
        """
        rfq = self.get_rfq(db, rfq_id, user_id=user_id, is_staff=False)
        if rfq.status != RFQStatus.DRAFT.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot submit RFQ in '{rfq.status}' status. Only DRAFT RFQs can be submitted.",
            )

        old_st = rfq.status
        rfq.status = RFQStatus.SUBMITTED.value
        rfq.submitted_at = datetime.now(timezone.utc)

        history = RFQStatusHistory(
            rfq_id=rfq.id,
            old_status=old_st,
            new_status=RFQStatus.SUBMITTED.value,
            changed_by_user_id=user_id,
            title="RFQ Submitted",
            description="RFQ submitted to institutional procurement team.",
        )
        db.add(history)
        db.commit()
        db.refresh(rfq)
        return rfq

    def cancel_rfq(
        self,
        db: Session,
        rfq_id: str,
        user_id: str,
        is_staff: bool = False,
        reason: Optional[str] = None,
    ) -> RFQ:
        """
        Cancel an active RFQ before acceptance.
        """
        rfq = self.get_rfq(db, rfq_id, user_id=user_id, is_staff=is_staff)
        if rfq.status in [RFQStatus.ACCEPTED.value, RFQStatus.CANCELLED.value, RFQStatus.EXPIRED.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"RFQ in '{rfq.status}' state cannot be cancelled.",
            )

        old_st = rfq.status
        rfq.status = RFQStatus.CANCELLED.value

        # Also cancel active quotes
        for q in rfq.quotes:
            if q.status in [QuoteStatus.DRAFT.value, QuoteStatus.SENT.value, QuoteStatus.NEGOTIATING.value]:
                q.status = QuoteStatus.CANCELLED.value

        history = RFQStatusHistory(
            rfq_id=rfq.id,
            old_status=old_st,
            new_status=RFQStatus.CANCELLED.value,
            changed_by_user_id=user_id,
            title="RFQ Cancelled",
            description=reason or "RFQ cancelled by user.",
        )
        db.add(history)
        db.commit()
        db.refresh(rfq)
        return rfq

    def request_revision(
        self,
        db: Session,
        rfq_id: str,
        user_id: str,
        revision_in: RFQRevisionRequest,
    ) -> RFQ:
        """
        Customer requests revision on a quoted RFQ.
        """
        rfq = self.get_rfq(db, rfq_id, user_id=user_id, is_staff=False)
        if rfq.status not in [RFQStatus.QUOTED.value, RFQStatus.NEGOTIATING.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot request revision for RFQ in '{rfq.status}' status.",
            )

        old_st = rfq.status
        rfq.status = RFQStatus.NEGOTIATING.value

        # Mark latest active quote as negotiating
        for q in rfq.quotes:
            if q.status == QuoteStatus.SENT.value:
                q.status = QuoteStatus.NEGOTIATING.value

        # Update items if supplied
        if revision_in.items:
            for item_in in revision_in.items:
                product = None
                if item_in.product_id:
                    product = db.scalar(select(Product).where(Product.id == item_in.product_id))

                rfq_item = RFQItem(
                    rfq_id=rfq.id,
                    product_id=product.id if product else item_in.product_id,
                    product_name=item_in.product_name or (product.name if product else "Material"),
                    product_sku=item_in.product_sku or (product.slug if product else None),
                    brand=item_in.brand or (product.brand if product else None),
                    unit=item_in.unit or (product.unit if product else "Pieces"),
                    requested_quantity=item_in.requested_quantity,
                    target_unit_price=item_in.target_unit_price,
                    notes=item_in.notes,
                )
                db.add(rfq_item)

        history = RFQStatusHistory(
            rfq_id=rfq.id,
            old_status=old_st,
            new_status=RFQStatus.NEGOTIATING.value,
            changed_by_user_id=user_id,
            title="Revision Requested by Customer",
            description=revision_in.notes,
        )
        db.add(history)
        db.commit()
        db.refresh(rfq)
        return rfq

    def update_rfq_status(
        self,
        db: Session,
        rfq_id: str,
        update_in: RFQStatusUpdateRequest,
        staff_user: User,
    ) -> RFQ:
        """
        Staff administrative update of RFQ status with transition validation.
        """
        rfq = self.get_rfq(db, rfq_id, is_staff=True)
        current_st = rfq.status
        target_st = update_in.status.value

        if target_st == current_st:
            return rfq

        allowed = RFQ_ALLOWED_TRANSITIONS.get(current_st, [])
        if target_st not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid RFQ status transition: '{current_st}' -> '{target_st}'. Allowed: {allowed}",
            )

        rfq.status = target_st
        history = RFQStatusHistory(
            rfq_id=rfq.id,
            old_status=current_st,
            new_status=target_st,
            changed_by_user_id=staff_user.id,
            title=f"Status changed to {target_st.replace('_', ' ').title()}",
            description=update_in.notes or f"Status updated by {staff_user.email}.",
        )
        db.add(history)
        db.commit()
        db.refresh(rfq)
        return rfq

    # =========================================================================
    # QUOTATION MANAGEMENT & CALCULATION ENGINE
    # =========================================================================

    def _calculate_quote_financials(
        self,
        db: Session,
        items_in: List[Any],
        delivery_charge_in: Optional[Decimal],
        discount_amount_in: Optional[Decimal],
    ) -> Tuple[List[Dict[str, Any]], Decimal, Decimal, Decimal, Decimal, Decimal]:
        """
        Server-side derivation of quote financials using Decimal arithmetic.
        """
        calculated_items = []
        subtotal = Decimal("0.00")
        total_item_discounts = Decimal("0.00")
        total_item_taxes = Decimal("0.00")

        gst_rate = Decimal(str(settings.GST_RATE))

        for it in items_in:
            qty = it.quoted_quantity
            quoted_rate = Decimal(str(it.quoted_unit_price)).quantize(Decimal("0.01"))

            # Catalog reference price
            catalog_rate = quoted_rate
            product = None
            if it.product_id:
                product = db.scalar(select(Product).where(Product.id == it.product_id))
                if product:
                    catalog_rate = Decimal(str(product.price)).quantize(Decimal("0.01"))

            line_sub = (quoted_rate * qty).quantize(Decimal("0.01"))
            line_disc = Decimal(str(getattr(it, "discount_amount", 0) or 0)).quantize(Decimal("0.01"))

            # Tax: calculated at standard GST rate unless explicitly overridden
            tax_in = getattr(it, "tax_amount", None)
            if tax_in is not None:
                line_tax = Decimal(str(tax_in)).quantize(Decimal("0.01"))
            else:
                taxable_base = max(Decimal("0.00"), line_sub - line_disc)
                line_tax = (taxable_base * gst_rate).quantize(Decimal("0.01"))

            line_tot = line_sub - line_disc + line_tax

            subtotal += line_sub
            total_item_discounts += line_disc
            total_item_taxes += line_tax

            calculated_items.append({
                "rfq_item_id": it.rfq_item_id,
                "product_id": it.product_id,
                "product_name": it.product_name or (product.name if product else "Quoted Material"),
                "product_sku": it.product_sku or (product.slug if product else None),
                "brand": it.brand or (product.brand if product else None),
                "unit": it.unit or (product.unit if product else "Piece"),
                "requested_quantity": it.requested_quantity,
                "quoted_quantity": qty,
                "catalog_unit_price_at_quote": catalog_rate,
                "quoted_unit_price": quoted_rate,
                "discount_amount": line_disc,
                "tax_amount": line_tax,
                "line_subtotal": line_sub,
                "line_total": line_tot,
            })

        overall_discount = (discount_amount_in or Decimal("0.00")) + total_item_discounts
        delivery_charge = delivery_charge_in or Decimal("0.00")
        tax_amount = total_item_taxes
        grand_total = subtotal - (discount_amount_in or Decimal("0.00")) + tax_amount + delivery_charge

        return (
            calculated_items,
            subtotal.quantize(Decimal("0.01")),
            overall_discount.quantize(Decimal("0.01")),
            tax_amount.quantize(Decimal("0.01")),
            delivery_charge.quantize(Decimal("0.01")),
            grand_total.quantize(Decimal("0.01")),
        )

    def create_quote(
        self,
        db: Session,
        rfq_id: str,
        staff_user: User,
        quote_in: QuoteCreateRequest,
    ) -> Quote:
        """
        Procurement manager creates a quote for an RFQ.
        """
        rfq = self.get_rfq(db, rfq_id, is_staff=True)
        if rfq.status in [RFQStatus.CANCELLED.value, RFQStatus.EXPIRED.value, RFQStatus.ACCEPTED.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot create quotation for RFQ in '{rfq.status}' state.",
            )

        # Determine version
        existing_version = db.scalar(
            select(func.max(Quote.version)).where(Quote.rfq_id == rfq.id)
        ) or 0
        new_version = existing_version + 1

        (
            calc_items,
            subtotal,
            discount_amount,
            tax_amount,
            delivery_charge,
            total,
        ) = self._calculate_quote_financials(
            db,
            quote_in.items,
            quote_in.delivery_charge,
            quote_in.discount_amount,
        )

        quote_number = self.generate_quote_number()
        initial_status = QuoteStatus.SENT.value if quote_in.send_now else QuoteStatus.DRAFT.value
        validity = quote_in.valid_until or (datetime.now(timezone.utc) + timedelta(days=14))

        quote = Quote(
            quote_number=quote_number,
            rfq_id=rfq.id,
            version=new_version,
            status=initial_status,
            subtotal=subtotal,
            discount_amount=discount_amount,
            tax_amount=tax_amount,
            delivery_charge=delivery_charge,
            total=total,
            valid_until=validity,
            customer_notes=quote_in.customer_notes,
            procurement_notes=quote_in.procurement_notes,
            created_by_user_id=staff_user.id,
        )
        db.add(quote)
        db.flush()

        for it in calc_items:
            quote_item = QuoteItem(
                quote_id=quote.id,
                **it,
            )
            db.add(quote_item)

        # Update RFQ status
        if quote_in.send_now:
            rfq.status = RFQStatus.QUOTED.value
            history = RFQStatusHistory(
                rfq_id=rfq.id,
                old_status=rfq.status,
                new_status=RFQStatus.QUOTED.value,
                changed_by_user_id=staff_user.id,
                title=f"Quotation #{quote.quote_number} (v{quote.version}) Sent",
                description=f"Institutional wholesale quote generated for ₹{quote.total:,.2f}.",
            )
            db.add(history)
        else:
            if rfq.status == RFQStatus.SUBMITTED.value:
                rfq.status = RFQStatus.UNDER_REVIEW.value

        db.commit()
        db.refresh(quote)
        logger.info(f"Created Quote {quote.quote_number} (v{quote.version}) for RFQ {rfq.rfq_number} by staff {staff_user.id}")
        return quote

    def revise_quote(
        self,
        db: Session,
        quote_id: str,
        staff_user: User,
        quote_in: QuoteCreateRequest,
    ) -> Quote:
        """
        Creates a new revision version (e.g. v2) for an existing Quote while preserving history.
        """
        old_quote = self.get_quote(db, quote_id, is_staff=True)
        rfq = old_quote.rfq

        # Deprecate old quote status
        if old_quote.status in [QuoteStatus.SENT.value, QuoteStatus.NEGOTIATING.value, QuoteStatus.DRAFT.value]:
            old_quote.status = QuoteStatus.NEGOTIATING.value

        return self.create_quote(db, rfq.id, staff_user, quote_in)

    def send_quote(
        self,
        db: Session,
        quote_id: str,
        staff_user: User,
    ) -> Quote:
        """
        Transition draft quote to SENT status and notify customer.
        """
        quote = self.get_quote(db, quote_id, is_staff=True)
        if quote.status != QuoteStatus.DRAFT.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot send quote in '{quote.status}' status.",
            )

        quote.status = QuoteStatus.SENT.value
        rfq = quote.rfq
        rfq.status = RFQStatus.QUOTED.value

        history = RFQStatusHistory(
            rfq_id=rfq.id,
            old_status=rfq.status,
            new_status=RFQStatus.QUOTED.value,
            changed_by_user_id=staff_user.id,
            title=f"Quotation #{quote.quote_number} (v{quote.version}) Sent",
            description=f"Quote published to customer dashboard for ₹{quote.total:,.2f}.",
        )
        db.add(history)
        db.commit()
        db.refresh(quote)
        return quote

    def expire_quote(
        self,
        db: Session,
        quote_id: str,
        staff_user: User,
    ) -> Quote:
        """
        Expire an unaccepted quote whose validity date has elapsed.
        """
        quote = self.get_quote(db, quote_id, is_staff=True)
        if quote.status in [QuoteStatus.ACCEPTED.value, QuoteStatus.CANCELLED.value, QuoteStatus.EXPIRED.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Quote in '{quote.status}' state cannot be expired.",
            )

        quote.status = QuoteStatus.EXPIRED.value
        rfq = quote.rfq
        if all(q.status in [QuoteStatus.EXPIRED.value, QuoteStatus.REJECTED.value, QuoteStatus.CANCELLED.value] for q in rfq.quotes):
            rfq.status = RFQStatus.EXPIRED.value

        db.commit()
        db.refresh(quote)
        return quote

    def get_quote(
        self,
        db: Session,
        quote_id_or_number: str,
        user_id: Optional[str] = None,
        is_staff: bool = False,
    ) -> Quote:
        """
        Retrieve Quote by ID or Quote number. Enforces customer isolation.
        """
        quote = db.scalar(
            select(Quote).where(
                or_(Quote.id == quote_id_or_number, Quote.quote_number == quote_id_or_number)
            )
        )
        if not quote:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Quote '{quote_id_or_number}' not found.",
            )

        if not is_staff and user_id and quote.rfq.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to view this quotation.",
            )

        return quote

    def list_rfq_quotes(
        self,
        db: Session,
        rfq_id: str,
        user_id: Optional[str] = None,
        is_staff: bool = False,
    ) -> List[Quote]:
        """
        List all quote revisions for a specific RFQ.
        """
        rfq = self.get_rfq(db, rfq_id, user_id=user_id, is_staff=is_staff)
        return rfq.quotes

    # =========================================================================
    # QUOTE ACCEPTANCE & CONVERSION TO REAL ORDER
    # =========================================================================

    def accept_quote(
        self,
        db: Session,
        quote_id: str,
        customer_user: User,
        payment_method: str = "online",
        notes: Optional[str] = None,
    ) -> Any:
        """
        Transactional quote acceptance:
        1. Validates authenticated customer ownership.
        2. Validates quote status (SENT or NEGOTIATING) and validity date.
        3. Invokes Phase 2E order_service.create_order_from_quote() with SELECT ... FOR UPDATE stock locks.
        4. Decrements inventory atomically.
        5. Updates Quote status to ACCEPTED and RFQ status to ACCEPTED.
        6. Logs status milestone.
        """
        quote = self.get_quote(db, quote_id, user_id=customer_user.id, is_staff=False)

        if quote.status not in [QuoteStatus.SENT.value, QuoteStatus.NEGOTIATING.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot accept quote in '{quote.status}' status. Quote must be active.",
            )

        if quote.valid_until:
            valid_dt = quote.valid_until
            if valid_dt.tzinfo is None:
                valid_dt = valid_dt.replace(tzinfo=timezone.utc)
            if valid_dt < datetime.now(timezone.utc):
                quote.status = QuoteStatus.EXPIRED.value
                db.commit()
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="This quotation has expired. Please request a new revision.",
                )

        rfq = quote.rfq

        # Invoke Phase 2E order creation (contains row locking & inventory deduction)
        order = order_service.create_order_from_quote(
            db=db,
            quote=quote,
            user=customer_user,
            payment_method=payment_method,
            notes=notes,
        )

        # Mark Quote and RFQ as ACCEPTED
        quote.status = QuoteStatus.ACCEPTED.value
        rfq.status = RFQStatus.ACCEPTED.value

        # Status History
        history = RFQStatusHistory(
            rfq_id=rfq.id,
            old_status=RFQStatus.QUOTED.value,
            new_status=RFQStatus.ACCEPTED.value,
            changed_by_user_id=customer_user.id,
            title="Quotation Accepted & Order Created",
            description=f"Quotation #{quote.quote_number} accepted by customer. Order #{order.order_number} generated.",
        )
        db.add(history)

        db.commit()
        db.refresh(quote)
        db.refresh(order)
        logger.info(f"Quote {quote.quote_number} accepted by user {customer_user.id}. Order {order.order_number} created.")
        return {"quote": quote, "order": order}

    def reject_quote(
        self,
        db: Session,
        quote_id: str,
        customer_user: User,
        reject_in: QuoteRejectRequest,
    ) -> Quote:
        """
        Customer rejects a quotation.
        """
        quote = self.get_quote(db, quote_id, user_id=customer_user.id, is_staff=False)
        if quote.status not in [QuoteStatus.SENT.value, QuoteStatus.NEGOTIATING.value]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot reject quote in '{quote.status}' status.",
            )

        quote.status = QuoteStatus.REJECTED.value
        rfq = quote.rfq
        rfq.status = RFQStatus.REJECTED.value

        history = RFQStatusHistory(
            rfq_id=rfq.id,
            old_status=rfq.status,
            new_status=RFQStatus.REJECTED.value,
            changed_by_user_id=customer_user.id,
            title="Quotation Rejected by Customer",
            description=reject_in.reason or "Customer rejected quotation.",
        )
        db.add(history)
        db.commit()
        db.refresh(quote)
        return quote


wholesale_service = WholesaleService()
