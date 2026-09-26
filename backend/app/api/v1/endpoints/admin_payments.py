import logging
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.rbac import Permission
from app.api.dependencies import require_permission, get_current_active_user
from app.models.user import User
from app.schemas.payment import (
    PaymentResponse,
    PaymentListResponse,
    PaymentMetricsResponse,
    VerifyPaymentRequest,
    RejectPaymentRequest,
    RefundPaymentRequest,
)
from app.services.payment_service import payment_service
from app.services.payment_reconciliation import payment_reconciliation_service

logger = logging.getLogger("hepna.api.admin_payments")
router = APIRouter(prefix="/admin/payments", tags=["admin-payments"])


@router.get("", response_model=PaymentListResponse)
def list_admin_payments(
    status: Optional[str] = Query(None, description="Filter by status (pending, awaiting_verification, verified, failed, refunded)"),
    method: Optional[str] = Query(None, description="Filter by payment method (upi, cod)"),
    search: Optional[str] = Query(None, description="Search by order #, payment ref, customer email, or UTR"),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_permission(Permission.PAYMENTS_VIEW)),
    db: Session = Depends(get_db),
):
    """
    Administrative listing of all payments with search and filtering.
    Requires 'payments.view' permission.
    """
    skip = (page - 1) * limit
    payments, total = payment_service.list_admin_payments(
        db=db,
        status_filter=status,
        method_filter=method,
        search_query=search,
        skip=skip,
        limit=limit,
    )
    return PaymentListResponse(
        payments=payments,
        total=total,
        page=page,
        limit=limit,
    )


@router.get("/metrics", response_model=PaymentMetricsResponse)
def get_payment_metrics(
    current_user: User = Depends(require_permission(Permission.PAYMENTS_VIEW)),
    db: Session = Depends(get_db),
):
    """
    Retrieves real PostgreSQL payment KPIs and metrics for the admin dashboard.
    Requires 'payments.view' permission.
    """
    metrics = payment_service.get_admin_payment_metrics(db)
    return metrics


@router.get("/reconciliation", response_model=List[Dict[str, Any]])
def get_reconciliation_report(
    current_user: User = Depends(require_permission(Permission.PAYMENTS_VIEW)),
    db: Session = Depends(get_db),
):
    """
    Finds discrepancies between payment records and order payment statuses.
    Requires 'payments.view' permission.
    """
    report = payment_reconciliation_service.check_reconciliation(db)
    return report


@router.post("/{payment_id}/reconcile", response_model=Dict[str, Any])
def reconcile_single_payment(
    payment_id: str,
    current_user: User = Depends(require_permission(Permission.PAYMENTS_VERIFY)),
    db: Session = Depends(get_db),
):
    """
    Synchronizes an order's payment status to match its authoritative payment record.
    Requires 'payments.verify' permission.
    """
    try:
        result = payment_reconciliation_service.reconcile_payment_order(
            db=db,
            admin_user_id=current_user.id,
            payment_id=payment_id,
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(e),
        )


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_admin_payment_details(
    payment_id: str,
    current_user: User = Depends(require_permission(Permission.PAYMENTS_VIEW)),
    db: Session = Depends(get_db),
):
    """
    Retrieves full details of a payment including complete audit event timeline.
    Requires 'payments.view' permission.
    """
    payment = payment_service.get_payment(db, payment_id)
    return payment


@router.post("/{payment_id}/verify", response_model=PaymentResponse)
def verify_payment(
    payment_id: str,
    payload: Optional[VerifyPaymentRequest] = None,
    current_user: User = Depends(require_permission(Permission.PAYMENTS_VERIFY)),
    db: Session = Depends(get_db),
):
    """
    Verifies a manual UPI or COD payment.
    Idempotent and executes inside a database transaction.
    Requires 'payments.verify' permission.
    """
    notes = payload.notes if payload else None
    payment = payment_service.verify_manual_upi_payment(
        db=db,
        admin_user_id=current_user.id,
        payment_id=payment_id,
        notes=notes,
    )
    return payment


@router.post("/{payment_id}/reject", response_model=PaymentResponse)
def reject_payment(
    payment_id: str,
    payload: RejectPaymentRequest,
    current_user: User = Depends(require_permission(Permission.PAYMENTS_REJECT)),
    db: Session = Depends(get_db),
):
    """
    Rejects a submitted payment reference with mandatory reason.
    Requires 'payments.reject' permission.
    """
    payment = payment_service.reject_manual_upi_payment(
        db=db,
        admin_user_id=current_user.id,
        payment_id=payment_id,
        reason=payload.reason,
    )
    return payment


@router.post("/{payment_id}/refund", response_model=PaymentResponse)
def create_refund(
    payment_id: str,
    payload: RefundPaymentRequest,
    current_user: User = Depends(require_permission(Permission.PAYMENTS_REFUND)),
    db: Session = Depends(get_db),
):
    """
    Creates an audit refund record for a verified payment.
    Requires 'payments.refund' permission.
    """
    payment = payment_service.create_refund_record(
        db=db,
        admin_user_id=current_user.id,
        payment_id=payment_id,
        reason=payload.reason,
        amount=payload.amount,
    )
    return payment
