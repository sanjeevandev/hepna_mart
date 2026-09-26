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


def generate_payment_reference() -> str:
    now_str = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d")
    rand_hex = uuid.uuid4().hex[:6].upper()
    return f"PAY-{now_str}-{rand_hex}"


class ManualUPIProvider(PaymentProvider):
    """
    Manual UPI payment provider implementation.
    Generates payment instructions with merchant QR/UPI ID,
    accepts customer UTR/reference submissions, and supports admin verification.
    """

    @property
    def provider_name(self) -> str:
        return PaymentProviderEnum.MANUAL_UPI.value

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
            payment_reference=generate_payment_reference(),
            provider=self.provider_name,
            payment_method=PaymentMethod.UPI.value,
            payment_status=PaymentStatus.PENDING.value,
            amount=amount,
            currency=currency,
        )
        db.add(payment)
        db.flush()

        # Log creation event
        event = PaymentEvent(
            payment_id=payment.id,
            event_type=PaymentEventType.PAYMENT_CREATED.value,
            old_status=None,
            new_status=PaymentStatus.PENDING.value,
            metadata_payload=metadata or {},
            created_by_user_id=user_id,
        )
        db.add(event)
        return payment

    def submit_reference(
        self,
        db: Session,
        payment: Payment,
        provider_reference: str,
        user_id: str,
    ) -> Payment:
        if payment.payment_status not in [PaymentStatus.PENDING.value, PaymentStatus.FAILED.value]:
            if payment.payment_status == PaymentStatus.VERIFIED.value:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Payment has already been verified.",
                )
            if payment.payment_status == PaymentStatus.AWAITING_VERIFICATION.value:
                # Update existing pending verification reference
                pass

        old_status = payment.payment_status
        payment.provider_reference = provider_reference.strip()
        payment.payment_status = PaymentStatus.AWAITING_VERIFICATION.value
        payment.failure_reason = None
        db.flush()

        event = PaymentEvent(
            payment_id=payment.id,
            event_type=PaymentEventType.PAYMENT_SUBMITTED.value,
            old_status=old_status,
            new_status=PaymentStatus.AWAITING_VERIFICATION.value,
            provider_event_id=provider_reference.strip(),
            metadata_payload={"submitted_reference": provider_reference.strip()},
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
            # Idempotent return if already verified
            return payment

        if payment.payment_status != PaymentStatus.AWAITING_VERIFICATION.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Cannot verify payment in status '{payment.payment_status}'. Must be in 'awaiting_verification'.",
            )

        old_status = payment.payment_status
        payment.payment_status = PaymentStatus.VERIFIED.value
        payment.verified_by_user_id = verified_by_user_id
        payment.verified_at = datetime.datetime.now(datetime.timezone.utc)
        payment.failure_reason = None
        db.flush()

        event = PaymentEvent(
            payment_id=payment.id,
            event_type=PaymentEventType.PAYMENT_VERIFIED.value,
            old_status=old_status,
            new_status=PaymentStatus.VERIFIED.value,
            metadata_payload=verification_data or {},
            created_by_user_id=verified_by_user_id,
        )
        db.add(event)
        return payment

    def reject_payment(
        self,
        db: Session,
        payment: Payment,
        reason: str,
        rejected_by_user_id: Optional[str] = None,
    ) -> Payment:
        if payment.payment_status == PaymentStatus.VERIFIED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot reject a payment that has already been verified. Use refund instead.",
            )

        old_status = payment.payment_status
        payment.payment_status = PaymentStatus.FAILED.value
        payment.failure_reason = reason
        db.flush()

        event = PaymentEvent(
            payment_id=payment.id,
            event_type=PaymentEventType.PAYMENT_REJECTED.value,
            old_status=old_status,
            new_status=PaymentStatus.FAILED.value,
            metadata_payload={"rejection_reason": reason},
            created_by_user_id=rejected_by_user_id,
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
        if payment.payment_status != PaymentStatus.VERIFIED.value:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Only verified payments can be refunded (current status: '{payment.payment_status}').",
            )

        old_status = payment.payment_status
        payment.payment_status = PaymentStatus.REFUNDED.value
        payment.failure_reason = reason
        db.flush()

        event = PaymentEvent(
            payment_id=payment.id,
            event_type=PaymentEventType.PAYMENT_REFUNDED.value,
            old_status=old_status,
            new_status=PaymentStatus.REFUNDED.value,
            metadata_payload={
                "refund_amount": str(amount or payment.amount),
                "refund_reason": reason or "Manual refund requested",
                "manual_processing_notice": "Manual UPI refund requires direct banking settlement.",
            },
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
            detail="Manual UPI does not support automated webhooks. Manual verification is required.",
        )

    def get_payment_status(
        self,
        db: Session,
        payment: Payment,
    ) -> PaymentStatus:
        return PaymentStatus(payment.payment_status)
