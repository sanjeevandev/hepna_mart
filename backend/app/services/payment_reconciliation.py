import logging
from typing import List, Dict, Any, Optional
from sqlalchemy import select, and_, or_
from sqlalchemy.orm import Session

from app.models.payment import Payment, PaymentStatus, PaymentEvent, PaymentEventType
from app.models.order import Order

logger = logging.getLogger("hepna.payment_reconciliation")


class PaymentReconciliationService:
    """
    Detects and reconciles state discrepancies between Payment records and Order records.
    """

    @staticmethod
    def check_reconciliation(db: Session) -> List[Dict[str, Any]]:
        """
        Finds all orders where payment_status differs from the latest Payment record status.
        """
        discrepancies: List[Dict[str, Any]] = []

        # Map PaymentStatus to expected Order payment_status
        status_map = {
            PaymentStatus.VERIFIED.value: "paid",
            PaymentStatus.AWAITING_VERIFICATION.value: "awaiting_verification",
            PaymentStatus.FAILED.value: "failed",
            PaymentStatus.CANCELLED.value: "cancelled",
            PaymentStatus.REFUNDED.value: "refunded",
            PaymentStatus.PENDING.value: "pending",
        }

        payments = db.scalars(
            select(Payment).order_by(Payment.created_at.desc())
        ).unique().all()

        seen_orders = set()
        for payment in payments:
            if payment.order_id in seen_orders:
                continue
            seen_orders.add(payment.order_id)

            order = payment.order
            if not order:
                continue

            expected_order_status = status_map.get(payment.payment_status, "pending")
            actual_order_status = order.payment_status.lower()

            if actual_order_status != expected_order_status:
                discrepancies.append({
                    "payment_id": payment.id,
                    "payment_reference": payment.payment_reference,
                    "provider_reference": payment.provider_reference,
                    "order_id": order.id,
                    "order_number": order.order_number,
                    "customer_name": order.customer_name,
                    "customer_email": order.customer_email,
                    "payment_amount": float(payment.amount),
                    "order_total": float(order.total_amount),
                    "payment_status": payment.payment_status,
                    "order_payment_status": order.payment_status,
                    "expected_order_status": expected_order_status,
                    "discrepancy_type": f"Payment is '{payment.payment_status}' but Order is '{order.payment_status}'",
                })

        return discrepancies

    @staticmethod
    def reconcile_payment_order(
        db: Session,
        admin_user_id: str,
        payment_id: str,
    ) -> Dict[str, Any]:
        """
        Reconciles an order's payment_status to match the authoritative payment record.
        """
        payment = db.scalar(
            select(Payment).where(Payment.id == payment_id).with_for_update()
        )
        if not payment:
            raise ValueError(f"Payment '{payment_id}' not found.")

        order = db.scalar(
            select(Order).where(Order.id == payment.order_id).with_for_update()
        )
        if not order:
            raise ValueError(f"Order '{payment.order_id}' not found.")

        status_map = {
            PaymentStatus.VERIFIED.value: "paid",
            PaymentStatus.AWAITING_VERIFICATION.value: "awaiting_verification",
            PaymentStatus.FAILED.value: "failed",
            PaymentStatus.CANCELLED.value: "cancelled",
            PaymentStatus.REFUNDED.value: "refunded",
            PaymentStatus.PENDING.value: "pending",
        }

        old_order_status = order.payment_status
        new_order_status = status_map.get(payment.payment_status, "pending")

        order.payment_status = new_order_status

        # Create audit event
        event = PaymentEvent(
            payment_id=payment.id,
            event_type=PaymentEventType.RECONCILIATION_SYNC.value,
            old_status=payment.payment_status,
            new_status=payment.payment_status,
            metadata_payload={
                "action": "reconcile_order_payment_status",
                "old_order_payment_status": old_order_status,
                "new_order_payment_status": new_order_status,
            },
            created_by_user_id=admin_user_id,
        )
        db.add(event)
        db.commit()

        logger.info(f"Reconciled order '{order.order_number}' from '{old_order_status}' to '{new_order_status}'.")
        return {
            "payment_id": payment.id,
            "order_number": order.order_number,
            "old_order_payment_status": old_order_status,
            "new_order_payment_status": new_order_status,
            "reconciled": True,
        }


payment_reconciliation_service = PaymentReconciliationService()
