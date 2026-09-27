import logging
from typing import List, Optional, Tuple, Dict, Any
from decimal import Decimal
import datetime
from fastapi import HTTPException, status
from sqlalchemy import select, func, or_, and_, desc
from sqlalchemy.orm import Session, joinedload

from app.models.payment import (
    Payment,
    PaymentEvent,
    PaymentStatus,
    PaymentMethod,
    PaymentProvider as PaymentProviderEnum,
    PaymentEventType,
)
from app.models.order import Order, PaymentStatus as OrderPaymentStatus
from app.models.user import User
from app.services.payment_providers import get_payment_provider, ManualUPIProvider

logger = logging.getLogger("hepna.payment_service")


class PaymentService:
    """
    Authoritative payment service for HEPNA MART.
    Manages payment lifecycles, UTR submissions, admin verifications,
    audit events, and synchronization with customer orders.
    """

    @staticmethod
    def create_payment(
        db: Session,
        user_id: str,
        order_id: str,
        payment_method: str = "upi",
        provider_name: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Payment:
        """
        Creates or returns an active payment record for an order.
        Amount is authoritative from order.total_amount.
        """
        order = db.scalar(
            select(Order).where(or_(Order.id == order_id, Order.order_number == order_id))
        )
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with ID '{order_id}' not found.",
            )

        if order.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to create a payment for this order.",
            )

        # Check existing payments for this order
        existing_payment = db.scalar(
            select(Payment)
            .where(Payment.order_id == order.id)
            .order_by(desc(Payment.created_at))
        )

        if existing_payment:
            if existing_payment.payment_status in [
                PaymentStatus.VERIFIED.value,
                PaymentStatus.AWAITING_VERIFICATION.value,
            ]:
                return existing_payment
            if existing_payment.payment_status == PaymentStatus.PENDING.value:
                # Reuse pending payment
                return existing_payment

        # Determine provider based on method
        norm_method = payment_method.lower().strip()
        if not provider_name:
            if norm_method == PaymentMethod.COD.value:
                provider_name = PaymentProviderEnum.COD.value
            else:
                provider_name = PaymentProviderEnum.MANUAL_UPI.value

        provider = get_payment_provider(provider_name)
        payment = provider.create_payment(
            db=db,
            order_id=order.id,
            user_id=user_id,
            amount=order.total_amount,
            currency=order.currency,
            metadata=metadata,
        )

        # Sync order payment method
        order.payment_method = norm_method
        if norm_method == PaymentMethod.COD.value:
            order.payment_status = "pending"
        db.commit()
        db.refresh(payment)
        return payment

    @staticmethod
    def get_payment(db: Session, payment_id: str) -> Payment:
        """Internal/admin payment retrieval."""
        payment = db.scalar(
            select(Payment)
            .options(joinedload(Payment.order), joinedload(Payment.user), joinedload(Payment.events))
            .where(Payment.id == payment_id)
        )
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment with ID '{payment_id}' not found.",
            )
        return payment

    @classmethod
    def get_user_payment(cls, db: Session, user_id: str, payment_id: str) -> Payment:
        """Customer-scoped retrieval with ownership authorization."""
        payment = cls.get_payment(db, payment_id)
        if payment.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to this payment record.",
            )
        return payment

    @staticmethod
    def get_order_payment(db: Session, user_id: str, order_id: str) -> Optional[Payment]:
        """Retrieves customer payment for a specific order."""
        order = db.scalar(
            select(Order).where(or_(Order.id == order_id, Order.order_number == order_id))
        )
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order with ID '{order_id}' not found.",
            )
        if order.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have access to payments for this order.",
            )

        payment = db.scalar(
            select(Payment)
            .options(joinedload(Payment.order), joinedload(Payment.events))
            .where(Payment.order_id == order.id)
            .order_by(desc(Payment.created_at))
        )
        return payment

    @classmethod
    def submit_upi_reference(
        cls,
        db: Session,
        user_id: str,
        payment_id: str,
        utr_reference: str,
    ) -> Payment:
        """
        Customer submits UPI transaction reference / UTR ID.
        Verifies duplicate protection and sets status to AWAITING_VERIFICATION.
        """
        ref_clean = utr_reference.strip()
        if not ref_clean or len(ref_clean) < 4:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Please enter a valid UPI transaction ID or UTR number.",
            )

        # Lock payment row
        payment = db.scalar(
            select(Payment).where(Payment.id == payment_id).with_for_update()
        )
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment with ID '{payment_id}' not found.",
            )

        if payment.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to update this payment.",
            )

        # Check duplicate UTR across all other payments
        duplicate = db.scalar(
            select(Payment).where(
                and_(
                    Payment.id != payment.id,
                    Payment.provider_reference == ref_clean,
                    Payment.payment_status.in_([
                        PaymentStatus.AWAITING_VERIFICATION.value,
                        PaymentStatus.VERIFIED.value,
                    ]),
                )
            )
        )
        if duplicate:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This UPI transaction reference has already been submitted for another payment.",
            )

        provider = get_payment_provider(payment.provider)
        if isinstance(provider, ManualUPIProvider):
            provider.submit_reference(db, payment, ref_clean, user_id)
        else:
            old_status = payment.payment_status
            payment.provider_reference = ref_clean
            payment.payment_status = PaymentStatus.AWAITING_VERIFICATION.value
            db.flush()

            event = PaymentEvent(
                payment_id=payment.id,
                event_type=PaymentEventType.PAYMENT_SUBMITTED.value,
                old_status=old_status,
                new_status=PaymentStatus.AWAITING_VERIFICATION.value,
                provider_event_id=ref_clean,
                created_by_user_id=user_id,
            )
            db.add(event)

        # Synchronize order payment status
        order = db.scalar(select(Order).where(Order.id == payment.order_id).with_for_update())
        if order:
            order.payment_status = "awaiting_verification"

        db.commit()
        db.refresh(payment)
        return payment

    @classmethod
    def verify_manual_upi_payment(
        cls,
        db: Session,
        admin_user_id: str,
        payment_id: str,
        notes: Optional[str] = None,
    ) -> Payment:
        """
        Admin verifies manual UPI payment in a transactional, idempotent operation.
        Updates payment to VERIFIED and order to PAID.
        """
        payment = db.scalar(
            select(Payment).where(Payment.id == payment_id).with_for_update()
        )
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment with ID '{payment_id}' not found.",
            )

        # Idempotency check: if already verified, return safely
        if payment.payment_status == PaymentStatus.VERIFIED.value:
            return payment

        if payment.payment_status != PaymentStatus.AWAITING_VERIFICATION.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot verify payment in status '{payment.payment_status}'. Payment must be 'awaiting_verification'.",
            )

        provider = get_payment_provider(payment.provider)
        verification_data = {"notes": notes or "Admin verified UPI reference manually"}
        provider.verify_payment(db, payment, verification_data, verified_by_user_id=admin_user_id)

        # Synchronize Order
        order = db.scalar(select(Order).where(Order.id == payment.order_id).with_for_update())
        if order:
            order.payment_status = "paid"

        db.commit()
        db.refresh(payment)
        logger.info(f"Payment '{payment.id}' successfully VERIFIED by admin '{admin_user_id}'.")
        return payment

    @classmethod
    def reject_manual_upi_payment(
        cls,
        db: Session,
        admin_user_id: str,
        payment_id: str,
        reason: str,
    ) -> Payment:
        """
        Admin rejects manual UPI payment with mandatory reason.
        Updates payment to FAILED and order payment_status to FAILED.
        """
        reason_clean = reason.strip()
        if not reason_clean:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A rejection reason is required to reject a payment.",
            )

        payment = db.scalar(
            select(Payment).where(Payment.id == payment_id).with_for_update()
        )
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment with ID '{payment_id}' not found.",
            )

        if payment.payment_status == PaymentStatus.VERIFIED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot reject a verified payment. Please issue a refund.",
            )

        provider = get_payment_provider(payment.provider)
        if hasattr(provider, "reject_payment"):
            provider.reject_payment(db, payment, reason_clean, rejected_by_user_id=admin_user_id)
        else:
            old_status = payment.payment_status
            payment.payment_status = PaymentStatus.FAILED.value
            payment.failure_reason = reason_clean
            db.flush()

            event = PaymentEvent(
                payment_id=payment.id,
                event_type=PaymentEventType.PAYMENT_REJECTED.value,
                old_status=old_status,
                new_status=PaymentStatus.FAILED.value,
                metadata_payload={"reason": reason_clean},
                created_by_user_id=admin_user_id,
            )
            db.add(event)

        # Synchronize Order
        order = db.scalar(select(Order).where(Order.id == payment.order_id).with_for_update())
        if order:
            order.payment_status = "failed"

        db.commit()
        db.refresh(payment)
        return payment

    @classmethod
    def cancel_payment(
        cls,
        db: Session,
        user_id: str,
        payment_id: str,
        reason: Optional[str] = None,
    ) -> Payment:
        """Cancels a pending payment."""
        payment = db.scalar(
            select(Payment).where(Payment.id == payment_id).with_for_update()
        )
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment with ID '{payment_id}' not found.",
            )

        if payment.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have permission to cancel this payment.",
            )

        if payment.payment_status == PaymentStatus.VERIFIED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot cancel a verified payment.",
            )

        old_status = payment.payment_status
        payment.payment_status = PaymentStatus.CANCELLED.value
        payment.failure_reason = reason or "Payment cancelled by user"
        db.flush()

        event = PaymentEvent(
            payment_id=payment.id,
            event_type=PaymentEventType.PAYMENT_CANCELLED.value,
            old_status=old_status,
            new_status=PaymentStatus.CANCELLED.value,
            metadata_payload={"cancellation_reason": payment.failure_reason},
            created_by_user_id=user_id,
        )
        db.add(event)
        db.commit()
        db.refresh(payment)
        return payment

    @classmethod
    def create_refund_record(
        cls,
        db: Session,
        admin_user_id: str,
        payment_id: str,
        reason: str,
        amount: Optional[Decimal] = None,
    ) -> Payment:
        """Creates an audit refund record for a verified payment."""
        payment = db.scalar(
            select(Payment).where(Payment.id == payment_id).with_for_update()
        )
        if not payment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Payment with ID '{payment_id}' not found.",
            )

        provider = get_payment_provider(payment.provider)
        provider.refund_payment(
            db=db,
            payment=payment,
            amount=amount,
            reason=reason,
            refunded_by_user_id=admin_user_id,
        )

        order = db.scalar(select(Order).where(Order.id == payment.order_id).with_for_update())
        if order:
            order.payment_status = "refunded"

        db.commit()
        db.refresh(payment)
        return payment

    @staticmethod
    def list_admin_payments(
        db: Session,
        status_filter: Optional[str] = None,
        method_filter: Optional[str] = None,
        search_query: Optional[str] = None,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[Payment], int]:
        """Lists payments for admin dashboard with search and filtering."""
        query = select(Payment).options(
            joinedload(Payment.order),
            joinedload(Payment.user),
            joinedload(Payment.verified_by),
        )

        filters = []
        if status_filter and status_filter.lower() != "all":
            filters.append(Payment.payment_status == status_filter.lower())
        if method_filter and method_filter.lower() != "all":
            filters.append(Payment.payment_method == method_filter.lower())

        if search_query and search_query.strip():
            sq = f"%{search_query.strip()}%"
            filters.append(
                or_(
                    Payment.payment_reference.ilike(sq),
                    Payment.provider_reference.ilike(sq),
                    Payment.id.ilike(sq),
                    Payment.order.has(Order.order_number.ilike(sq)),
                    Payment.user.has(User.email.ilike(sq)),
                )
            )

        if filters:
            query = query.where(and_(*filters))

        count_query = select(func.count()).select_from(Payment)
        if filters:
            count_query = count_query.where(and_(*filters))
        total_count = db.scalar(count_query) or 0

        payments = db.scalars(
            query.order_by(desc(Payment.created_at)).offset(skip).limit(limit)
        ).unique().all()

        return payments, total_count

    @staticmethod
    def get_admin_payment_metrics(db: Session) -> Dict[str, Any]:
        """Aggregates real PostgreSQL payment metrics."""
        today_start = datetime.datetime.now(datetime.timezone.utc).replace(
            hour=0, minute=0, second=0, microsecond=0
        )

        pending_verification = db.scalar(
            select(func.count())
            .select_from(Payment)
            .where(Payment.payment_status == PaymentStatus.AWAITING_VERIFICATION.value)
        ) or 0

        verified_today = db.scalar(
            select(func.count())
            .select_from(Payment)
            .where(
                and_(
                    Payment.payment_status == PaymentStatus.VERIFIED.value,
                    Payment.verified_at >= today_start,
                )
            )
        ) or 0

        failed_payments = db.scalar(
            select(func.count())
            .select_from(Payment)
            .where(Payment.payment_status == PaymentStatus.FAILED.value)
        ) or 0

        cod_orders = db.scalar(
            select(func.count())
            .select_from(Payment)
            .where(Payment.payment_method == PaymentMethod.COD.value)
        ) or 0

        upi_verified_volume = db.scalar(
            select(func.sum(Payment.amount))
            .select_from(Payment)
            .where(
                and_(
                    Payment.payment_method == PaymentMethod.UPI.value,
                    Payment.payment_status == PaymentStatus.VERIFIED.value,
                )
            )
        ) or Decimal("0.00")

        total_payments = db.scalar(select(func.count()).select_from(Payment)) or 0

        refund_pending = db.scalar(
            select(func.count())
            .select_from(Payment)
            .where(Payment.payment_status == PaymentStatus.REFUNDED.value)
        ) or 0

        return {
            "pending_verification": pending_verification,
            "verified_today": verified_today,
            "failed_payments": failed_payments,
            "cod_orders": cod_orders,
            "upi_volume": float(upi_verified_volume),
            "refund_pending": refund_pending,
            "total_payments": total_payments,
        }


payment_service = PaymentService()
