import uuid
import datetime
from typing import Optional, Dict, Any
from decimal import Decimal
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.payment import (
    Payment,
    PaymentEvent,
    PaymentStatus,
    PaymentMethod,
    PaymentProvider as PaymentProviderEnum,
    PaymentEventType,
)
from app.services.payment_providers.base import PaymentProvider


def generate_cod_reference() -> str:
    now_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d")
    rand_hex = uuid.uuid4().hex[:6].upper()
    return f"COD-{now_str}-{rand_hex}"


class CODProvider(PaymentProvider):
    """
    Cash on Delivery (COD) payment provider implementation.
    Tracks payment obligation upon delivery collection.
    """

    @property
    def provider_name(self) -> str:
        return PaymentProviderEnum.COD.value

    def create_payment(
        self,
        db: Session,
        order_id: str,
        user_id: str,
        amount: Decimal,
        currency: str = "INR",
        metadata: Optional[Dict[str, Any]] = None,
    ) -> Payment:
        payment = Payment(
            order_id=order_id,
            user_id=user_id,
            payment_reference=generate_cod_reference(),
            provider=self.provider_name,
            payment_method=PaymentMethod.COD.value,
            payment_status=PaymentStatus.PENDING.value,
            amount=amount,
            currency=currency,
        )
        db.add(payment)
        db.flush()

        event = PaymentEvent(
            payment_id=payment.id,
            event_type=PaymentEventType.PAYMENT_CREATED.value,
            old_status=None,
            new_status=PaymentStatus.PENDING.value,
            metadata_payload=metadata or {"note": "Cash on Delivery payment created"},
            created_by_user_id=user_id,
        )
        db.add(event)
        return payment

    def verify_payment(
        self,
        db: Session,
        payment: Payment,
        verification_data: Optional[Dict[str, Any]] = None,
        verified_by_user_id: Optional[str] = None,
    ) -> Payment:
        if payment.payment_status == PaymentStatus.VERIFIED.value:
            return payment

        old_status = payment.payment_status
        payment.payment_status = PaymentStatus.VERIFIED.value
        payment.verified_by_user_id = verified_by_user_id
        payment.verified_at = datetime.datetime.now(datetime.timezone.utc)
        db.flush()

        event = PaymentEvent(
            payment_id=payment.id,
            event_type=PaymentEventType.PAYMENT_VERIFIED.value,
            old_status=old_status,
            new_status=PaymentStatus.VERIFIED.value,
            metadata_payload=verification_data or {"note": "COD payment collected upon site delivery"},
            created_by_user_id=verified_by_user_id,
        )
        db.add(event)
        return payment

    def refund_payment(
        self,
        db: Session,
        payment: Payment,
        amount: Optional[Decimal] = None,
        reason: Optional[str] = None,
        refunded_by_user_id: Optional[str] = None,
    ) -> Payment:
        old_status = payment.payment_status
        payment.payment_status = PaymentStatus.REFUNDED.value
        payment.failure_reason = reason
        db.flush()

        event = PaymentEvent(
            payment_id=payment.id,
            event_type=PaymentEventType.PAYMENT_REFUNDED.value,
            old_status=old_status,
            new_status=PaymentStatus.REFUNDED.value,
            metadata_payload={"refund_reason": reason or "COD payment refunded/reversed"},
            created_by_user_id=refunded_by_user_id,
        )
        db.add(event)
        return payment

    def handle_webhook(
        self,
        db: Session,
        payload: Dict[str, Any],
        signature: Optional[str] = None,
    ) -> Dict[str, Any]:
        raise HTTPException(
            status_code=status.HTTP_501_NOT_IMPLEMENTED,
            detail="COD does not use webhooks.",
        )

    def get_payment_status(
        self,
        db: Session,
        payment: Payment,
    ) -> PaymentStatus:
        return PaymentStatus(payment.payment_status)
