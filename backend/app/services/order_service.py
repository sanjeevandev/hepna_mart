import random
import logging
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional, Tuple, Dict, Any

from fastapi import HTTPException, status
from sqlalchemy import select, func, or_
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User
from app.models.product import Product
from app.models.inventory import Inventory
from app.models.cart import Cart, CartItem
from app.models.order import (
    Order,
    OrderItem,
    OrderStatusHistory,
    OrderStatus,
    PaymentStatus,
    PaymentMethod,
)
from app.schemas.order import (
    CheckoutRequest,
    OrderStatusUpdateRequest,
)
from app.services.cart_service import cart_service

logger = logging.getLogger("hepna.services.order")

# Canonical order status transitions map
ALLOWED_TRANSITIONS: Dict[str, List[str]] = {
    "pending": ["confirmed", "cancelled"],
    "confirmed": ["processing", "cancelled"],
    "processing": ["packed", "cancelled"],
    "packed": ["shipped", "cancelled"],
    "shipped": ["out-for-delivery"],
    "out-for-delivery": ["delivered"],
    "delivered": [],
    "cancelled": [],
}

MILESTONE_DETAILS: Dict[str, Dict[str, str]] = {
    "pending": {
        "title": "Order Placed (Pending Verification)",
        "description": "Order submitted and awaiting payment/system confirmation.",
    },
    "confirmed": {
        "title": "Order Confirmed",
        "description": "Payment verified and material allocations locked with fulfillment hub.",
    },
    "processing": {
        "title": "Materials Being Prepared",
        "description": "Batch testing, quality inspection, and warehouse pulling in progress.",
    },
    "packed": {
        "title": "Packed & Palletized",
        "description": "Waterproof pallet wrap and transit banding secured for heavy load dispatch.",
    },
    "shipped": {
        "title": "Dispatched from Central Hub",
        "description": "Vehicle departed from regional fulfillment depot.",
    },
    "out-for-delivery": {
        "title": "Out for Site Delivery",
        "description": "Heavy transport vehicle en route to construction site. Driver in contact with supervisor.",
    },
    "delivered": {
        "title": "Delivered & Offloaded",
        "description": "Materials safely offloaded at site and physical delivery challan signed.",
    },
    "cancelled": {
        "title": "Order Cancelled",
        "description": "Order has been cancelled and allocated stock released back to warehouse.",
    },
}


class OrderService:
    @staticmethod
    def generate_order_number() -> str:
        """
        Generate deterministic unique human-readable order identifier.
        Format: HEP-YYYYMMDD-XXXXXX (e.g. HEP-20260926-849201)
        """
        today_str = datetime.now(timezone.utc).strftime("%Y%m%d")
        rand_suffix = random.randint(100000, 999999)
        return f"HEP-{today_str}-{rand_suffix}"

    def create_order_from_cart(
        self,
        db: Session,
        user: User,
        checkout_in: CheckoutRequest,
    ) -> Order:
        """
        Atomic checkout transaction:
        1. Validates authenticated customer cart.
        2. Acquires row-level locks on target Inventory records (`FOR UPDATE`) to prevent overselling.
        3. Validates active products and stock levels.
        4. Recalculates authoritative prices, subtotal, 18% GST, and delivery charge.
        5. Creates Order and historical snapshot OrderItems.
        6. Decrements warehouse inventory.
        7. Clears checked-out items from customer's cart.
        8. Creates initial status history milestone.
        """
        # 1. Load user's cart
        cart = db.scalar(select(Cart).where(Cart.user_id == user.id))
        if not cart or not cart.items:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot checkout: Your shopping cart is empty.",
            )

        # 2. Determine items to checkout
        items_to_checkout = []
        if checkout_in.items:
            requested_product_ids = {i.product_id: i.quantity for i in checkout_in.items}
            for cart_item in cart.items:
                if cart_item.product_id in requested_product_ids:
                    qty = requested_product_ids[cart_item.product_id]
                    items_to_checkout.append((cart_item, qty))
        else:
            for cart_item in cart.items:
                items_to_checkout.append((cart_item, cart_item.quantity))

        if not items_to_checkout:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="None of the specified items were found in your active cart.",
            )

        # 3. Row locking and stock validation
        subtotal = Decimal("0.00")
        order_items_data = []
        checked_out_cart_item_ids = []

        for cart_item, qty in items_to_checkout:
            if qty <= 0:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Invalid quantity {qty} for product {cart_item.product_id}.",
                )

            # Row lock inventory
            inv = db.scalar(
                select(Inventory)
                .where(Inventory.product_id == cart_item.product_id)
                .with_for_update()
            )

            product = db.scalar(
                select(Product).where(Product.id == cart_item.product_id)
            )

            if not product:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Product with ID '{cart_item.product_id}' was not found in catalog.",
                )

            if not inv or inv.available_quantity < qty:
                available = inv.available_quantity if inv else 0
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=(
                        f"Insufficient inventory for '{product.name}'. "
                        f"Requested: {qty}, Available in depot: {available}."
                    ),
                )

            # Server-side pricing calculation
            unit_price = Decimal(str(product.price))
            mrp = Decimal(str(product.mrp))
            line_subtotal = (unit_price * qty).quantize(Decimal("0.01"))
            discount_amount = max(Decimal("0.00"), (mrp - unit_price) * qty)
            line_tax = (line_subtotal * Decimal(str(settings.GST_RATE))).quantize(Decimal("0.01"))
            line_total = line_subtotal + line_tax

            subtotal += line_subtotal

            order_items_data.append({
                "product_id": product.id,
                "product_name": product.name,
                "product_sku": product.slug,
                "product_image": product.images[0] if product.images else None,
                "brand": product.brand,
                "unit": product.unit,
                "quantity": qty,
                "unit_price": unit_price,
                "mrp": mrp,
                "discount_amount": discount_amount,
                "tax_amount": line_tax,
                "subtotal": line_subtotal,
                "total": line_total,
                "inv_ref": inv,
            })
            checked_out_cart_item_ids.append(cart_item.id)

        # 4. Compute Tax & Delivery
        tax_amount = (subtotal * Decimal(str(settings.GST_RATE))).quantize(Decimal("0.01"))
        free_thresh = Decimal(str(settings.FREE_DELIVERY_THRESHOLD))
        if subtotal >= free_thresh:
            delivery_charge = Decimal("0.00")
        else:
            delivery_charge = Decimal(str(settings.STANDARD_DELIVERY_FEE))

        discount_total = sum(d["discount_amount"] for d in order_items_data)
        total_amount = subtotal + tax_amount + delivery_charge

        # 5. Customer details snapshot
        customer_name = (
            checkout_in.customer_name
            or f"{user.first_name} {user.last_name}".strip()
            or user.email
        )
        customer_email = checkout_in.customer_email or user.email
        customer_phone = (
            checkout_in.customer_phone
            or getattr(user, "phone", None)
            or checkout_in.delivery_address.phone
        )

        order_number = self.generate_order_number()

        # 6. Payment status logic
        payment_method_raw = (checkout_in.payment_method or "online").lower()
        if "cod" in payment_method_raw or "cash" in payment_method_raw:
            payment_status_val = PaymentStatus.PENDING.value
            payment_method_val = PaymentMethod.COD.value
        else:
            payment_status_val = PaymentStatus.PENDING.value
            payment_method_val = PaymentMethod.ONLINE.value

        # Calculate estimated delivery date if not provided
        est_delivery = checkout_in.delivery_address.required_delivery_date
        if not est_delivery:
            est_delivery = datetime.now(timezone.utc).strftime("%Y-%m-%d")

        # 7. Create Order instance
        order = Order(
            user_id=user.id,
            order_number=order_number,
            status=OrderStatus.CONFIRMED.value,
            payment_status=payment_status_val,
            payment_method=payment_method_val,
            subtotal=subtotal,
            tax_amount=tax_amount,
            delivery_charge=delivery_charge,
            discount_amount=discount_total,
            total_amount=total_amount,
            currency="INR",
            customer_name=customer_name,
            customer_email=customer_email,
            customer_phone=customer_phone,
            notes=checkout_in.notes,
            estimated_delivery=est_delivery,
            delivery_window="10:00 AM – 02:00 PM",
            project_id=checkout_in.project_id,
            project_name=checkout_in.project_name or checkout_in.delivery_address.site_name,
            delivery_address=checkout_in.delivery_address.model_dump(),
        )
        db.add(order)
        db.flush()  # Populates order.id

        # 8. Create OrderItems & Decrement Inventory
        for item_data in order_items_data:
            inv = item_data.pop("inv_ref")
            order_item = OrderItem(
                order_id=order.id,
                **item_data,
            )
            db.add(order_item)

            # Decrement stock atomically
            inv.quantity -= item_data["quantity"]

        # 9. Clean up purchased cart items
        for c_item in list(cart.items):
            if c_item.id in checked_out_cart_item_ids:
                db.delete(c_item)

        # 10. Create initial status history entry
        status_history = OrderStatusHistory(
            order_id=order.id,
            old_status=None,
            new_status=OrderStatus.CONFIRMED.value,
            changed_by_user_id=user.id,
            title="Order Confirmed",
            description="Payment verified and material allocations locked with fulfillment depot.",
            completed=True,
            active=True,
        )
        db.add(status_history)

        db.commit()
        db.refresh(order)
        logger.info(f"Successfully created order {order.order_number} for user {user.id} with {len(order.items)} items.")
        return order

    def get_order(
        self,
        db: Session,
        order_id_or_number: str,
        user_id: Optional[str] = None,
        is_staff: bool = False,
    ) -> Order:
        """
        Fetch order by ID or order_number.
        Enforces customer ownership unless is_staff is True.
        """
        stmt = select(Order).where(
            or_(Order.id == order_id_or_number, Order.order_number == order_id_or_number)
        )
        order = db.scalar(stmt)
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Order '{order_id_or_number}' not found.",
            )

        if not is_staff and user_id and order.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied: You do not have permission to view this order.",
            )

        return order

    def list_user_orders(
        self,
        db: Session,
        user_id: str,
        skip: int = 0,
        limit: int = 50,
    ) -> Tuple[List[Order], int]:
        """
        List all orders placed by the specified customer.
        """
        count_stmt = select(func.count(Order.id)).where(Order.user_id == user_id)
        total_count = db.scalar(count_stmt) or 0

        stmt = (
            select(Order)
            .where(Order.user_id == user_id)
            .order_by(Order.created_at.desc())
            .offset(skip)
            .limit(limit)
        )
        orders = list(db.scalars(stmt).all())
        return orders, total_count

    def list_admin_orders(
        self,
        db: Session,
        status_filter: Optional[str] = None,
        search: Optional[str] = None,
        skip: int = 0,
        limit: int = 100,
    ) -> Tuple[List[Order], int]:
        """
        Staff portal: List all platform orders with optional status filtering and full-text search.
        """
        query = select(Order)

        if status_filter and status_filter.upper() != "ALL":
            norm_status = status_filter.lower()
            query = query.where(Order.status == norm_status)

        if search:
            search_pattern = f"%{search.strip().lower()}%"
            query = query.where(
                or_(
                    func.lower(Order.order_number).like(search_pattern),
                    func.lower(Order.customer_name).like(search_pattern),
                    func.lower(Order.customer_email).like(search_pattern),
                    func.lower(Order.project_name).like(search_pattern),
                )
            )

        count_stmt = select(func.count()).select_from(query.subquery())
        total_count = db.scalar(count_stmt) or 0

        query = query.order_by(Order.created_at.desc()).offset(skip).limit(limit)
        orders = list(db.scalars(query).all())
        return orders, total_count

    def cancel_order(
        self,
        db: Session,
        order_id_or_number: str,
        reason: str,
        user_id: Optional[str] = None,
        is_staff: bool = False,
    ) -> Order:
        """
        Cancel an eligible order and release allocated stock back to inventory.
        """
        order = self.get_order(db, order_id_or_number, user_id=user_id, is_staff=is_staff)

        # Cancellation validation: Only allowed in early stages
        cancellable_statuses = ["pending", "confirmed", "processing"]
        if order.status not in cancellable_statuses:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Order '{order.order_number}' cannot be cancelled in state '{order.status}'. "
                    f"Only orders in {cancellable_statuses} can be cancelled."
                ),
            )

        old_status = order.status
        order.status = OrderStatus.CANCELLED.value
        order.cancellation_reason = reason
        order.cancelled_at = datetime.now(timezone.utc)

        # Restock inventory
        for item in order.items:
            if item.product_id:
                inv = db.scalar(
                    select(Inventory)
                    .where(Inventory.product_id == item.product_id)
                    .with_for_update()
                )
                if inv:
                    inv.quantity += item.quantity

        # Mark prior history completed, add cancelled entry
        for hist in order.status_history:
            hist.active = False

        status_history = OrderStatusHistory(
            order_id=order.id,
            old_status=old_status,
            new_status=OrderStatus.CANCELLED.value,
            changed_by_user_id=user_id,
            title="Order Cancelled",
            description=f"Reason: {reason}",
            note=reason,
            completed=True,
            active=False,
        )
        db.add(status_history)

        db.commit()
        db.refresh(order)
        logger.info(f"Order {order.order_number} cancelled by user {user_id}. Stock restored.")
        return order

    def update_order_status(
        self,
        db: Session,
        order_id_or_number: str,
        update_in: OrderStatusUpdateRequest,
        staff_user: User,
    ) -> Order:
        """
        Staff portal: Advance order along fulfillment timeline.
        Validates transition rules and logs status history.
        """
        order = self.get_order(db, order_id_or_number, is_staff=True)
        new_status_val = update_in.status.value.lower()
        old_status_val = order.status.lower()

        if old_status_val == new_status_val:
            return order

        allowed = ALLOWED_TRANSITIONS.get(old_status_val, [])
        if new_status_val not in allowed:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    f"Invalid status transition from '{old_status_val}' to '{new_status_val}'. "
                    f"Allowed transitions from '{old_status_val}': {allowed}."
                ),
            )

        # Milestone defaults
        default_info = MILESTONE_DETAILS.get(new_status_val, {
            "title": f"Status: {new_status_val.capitalize()}",
            "description": f"Order status updated to {new_status_val}.",
        })

        title = update_in.title or default_info["title"]
        description = update_in.description or default_info["description"]

        order.status = new_status_val

        # Update previous status histories active state
        for hist in order.status_history:
            hist.active = False

        # Add new status history
        history_entry = OrderStatusHistory(
            order_id=order.id,
            old_status=old_status_val,
            new_status=new_status_val,
            changed_by_user_id=staff_user.id,
            title=title,
            description=description,
            note=update_in.note,
            completed=True,
            active=True,
        )
        db.add(history_entry)

        db.commit()
        db.refresh(order)
        logger.info(f"Staff {staff_user.email} updated order {order.order_number} to {new_status_val}.")
        return order

    def reorder(
        self,
        db: Session,
        order_id_or_number: str,
        user: User,
    ) -> Dict[str, Any]:
        """
        Re-add active products from historical order into user's current shopping cart
        using CURRENT catalog prices and verifying live stock availability.
        """
        order = self.get_order(db, order_id_or_number, user_id=user.id)
        added_count = 0
        unavailable_items = []

        for item in order.items:
            if not item.product_id:
                unavailable_items.append(item.product_name)
                continue

            product = db.scalar(select(Product).where(Product.id == item.product_id))
            inv = db.scalar(select(Inventory).where(Inventory.product_id == item.product_id))

            if not product or not inv or inv.available_quantity <= 0:
                unavailable_items.append(item.product_name)
                continue

            # Add to cart using current product price and max available quantity
            qty_to_add = min(item.quantity, inv.available_quantity)
            try:
                cart_service.add_item(
                    db=db,
                    user_id=user.id,
                    product_id=product.id,
                    quantity=qty_to_add,
                )
                added_count += 1
            except Exception as e:
                logger.warning(f"Could not re-add {product.name} to cart: {e}")
                unavailable_items.append(product.name)

        return {
            "added_count": added_count,
            "unavailable_items": unavailable_items,
            "message": f"Successfully re-added {added_count} items to your cart.",
        }


order_service = OrderService()
