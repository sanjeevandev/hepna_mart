import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.payment_config import payment_config
from app.core.rate_limiter import RateLimitGuard
from app.core.audit import log_audit_event, AuditEventType
from app.api.dependencies import get_current_active_user
from app.models.user import User
from app.models.payment import Payment
from app.schemas.payment import (
    CreatePaymentRequest,
    SubmitUPIRequest,
    PaymentResponse,
    PaymentConfigResponse,
)
from app.services.payment_service import payment_service

logger = logging.getLogger("hepna.api.payments")
router = APIRouter(prefix="/payments", tags=["payments"])

upi_submit_rate_guard = RateLimitGuard(
    max_requests=settings.RATE_LIMIT_PAYMENTS_MAX_REQUESTS,
    window_seconds=settings.RATE_LIMIT_PAYMENTS_WINDOW_SECONDS,
    key_prefix="payments:submit_upi",
)


@router.get("/config", response_model=PaymentConfigResponse)
def get_payment_configuration():
    """
    Returns public payment instructions (UPI ID, merchant name, QR path, payment methods enabled).
    """
    return payment_config.get_public_config()


@router.post("/create", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
def create_payment(
    payload: CreatePaymentRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Initializes a new payment for an authoritative customer order.
    The payment amount is strictly determined by the server from order.total_amount.
    """
    payment = payment_service.create_payment(
        db=db,
        user_id=current_user.id,
        order_id=payload.order_id,
        payment_method=payload.payment_method,
        provider_name=payload.provider,
    )
    log_audit_event(
        event_type=AuditEventType.PAYMENT_INITIATED,
        target_type="payment",
        target_id=payment.id,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        details={
            "order_id": payload.order_id,
            "method": payload.payment_method,
            "amount": float(payment.amount),
        },
    )
    return payment


@router.get("/order/{order_id}", response_model=Optional[PaymentResponse])
def get_payment_for_order(
    order_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves the payment record associated with a customer order.
    """
    payment = payment_service.get_order_payment(db, current_user.id, order_id)
    return payment


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment_by_id(
    payment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves customer payment details.
    Strictly restricted to the payment owner.
    """
    payment = payment_service.get_user_payment(db, current_user.id, payment_id)
    return payment


@router.post("/{payment_id}/submit-upi", response_model=PaymentResponse)
def submit_upi_reference(
    payment_id: str,
    payload: SubmitUPIRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    _rate_limit: None = Depends(upi_submit_rate_guard),
):
    """
    Customer submits UPI UTR/Transaction reference ID.
    Transitions payment to 'awaiting_verification' and prevents duplicate reference numbers.
    """
    payment = payment_service.submit_upi_reference(
        db=db,
        user_id=current_user.id,
        payment_id=payment_id,
        utr_reference=payload.utr_reference,
    )
    log_audit_event(
        event_type=AuditEventType.PAYMENT_UPI_SUBMITTED,
        target_type="payment",
        target_id=payment.id,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        details={
            "utr_reference": payload.utr_reference,
            "order_id": payment.order_id,
            "amount": float(payment.amount),
        },
    )
    return payment


@router.post("/{payment_id}/cancel", response_model=PaymentResponse)
def cancel_payment(
    payment_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Cancels a pending payment transaction.
    """
    payment = payment_service.cancel_payment(
        db=db,
        user_id=current_user.id,
        payment_id=payment_id,
    )
    log_audit_event(
        event_type=AuditEventType.PAYMENT_CANCELLED,
        target_type="payment",
        target_id=payment.id,
        actor_id=current_user.id,
        actor_role=current_user.role.value,
        details={"order_id": payment.order_id},
    )
    return payment


@router.post("/webhooks/{provider}")
def handle_provider_webhook(
    provider: str,
    payload: Dict[str, Any],
    db: Session = Depends(get_db),
):
    """
    Gateway-ready webhook entrypoint.
    Returns 501 Unsupported for Phase 2G because manual UPI / COD do not use simulated webhooks.
    """
    raise HTTPException(
        status_code=status.HTTP_501_NOT_IMPLEMENTED,
        detail=f"Automated gateway webhook processing for provider '{provider}' is currently disabled. Manual verification is active.",
    )

