import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import (
    require_authenticated_user,
    require_permission,
)
from app.core.rbac import Permission
from app.models.user import User
from app.schemas.wholesale import (
    RFQCreateRequest,
    RFQResponse,
    RFQListResponse,
    RFQRevisionRequest,
    RFQStatusUpdateRequest,
    QuoteCreateRequest,
    QuoteUpdateRequest,
    QuoteResponse,
    QuoteListResponse,
    QuoteRejectRequest,
)
from app.schemas.order import OrderResponse
from app.services.wholesale_service import wholesale_service

logger = logging.getLogger("hepna.api.wholesale")

# Customer RFQ & Quote Routers
rfq_router = APIRouter(prefix="/rfqs", tags=["Customer RFQs & Wholesale Procurement"])
quote_router = APIRouter(prefix="/quotes", tags=["Customer Quotations & Approvals"])

# Staff Procurement & Administration Routers
admin_rfq_router = APIRouter(prefix="/admin/rfqs", tags=["Staff RFQ Queue & Procurement"])
admin_quote_router = APIRouter(prefix="/admin/quotes", tags=["Staff Quotation Management"])


# ============================================================================
# CUSTOMER RFQ ENDPOINTS
# ============================================================================

@rfq_router.post(
    "",
    response_model=RFQResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Create Institutional RFQ",
    description="Submits a bulk material inquiry or creates an RFQ draft for the authenticated customer.",
)
def create_rfq(
    payload: RFQCreateRequest,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return wholesale_service.create_rfq(
        db=db,
        user=current_user,
        rfq_in=payload,
    )


@rfq_router.get(
    "",
    response_model=RFQListResponse,
    summary="List Customer RFQs",
    description="Returns paginated list of RFQs created by the authenticated customer.",
)
def list_rfqs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by RFQ status"),
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * page_size
    items, total = wholesale_service.list_user_rfqs(
        db=db,
        user_id=current_user.id,
        skip=skip,
        limit=page_size,
        status_filter=status,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@rfq_router.get(
    "/{rfq_id}",
    response_model=RFQResponse,
    summary="Get RFQ Details",
    description="Returns detailed RFQ information including line items, status milestone history, and active quotes.",
)
def get_rfq_detail(
    rfq_id: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return wholesale_service.get_rfq(
        db=db,
        rfq_id_or_number=rfq_id,
        user_id=current_user.id,
        is_staff=False,
    )


@rfq_router.post(
    "/{rfq_id}/submit",
    response_model=RFQResponse,
    summary="Submit Draft RFQ",
    description="Transitions an RFQ from DRAFT to SUBMITTED status for institutional review.",
)
def submit_draft_rfq(
    rfq_id: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return wholesale_service.submit_rfq(
        db=db,
        rfq_id=rfq_id,
        user_id=current_user.id,
    )


@rfq_router.post(
    "/{rfq_id}/cancel",
    response_model=RFQResponse,
    summary="Cancel RFQ",
    description="Cancels an eligible pre-acceptance RFQ.",
)
def cancel_rfq(
    rfq_id: str,
    reason: Optional[str] = Query(None, description="Reason for cancellation"),
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return wholesale_service.cancel_rfq(
        db=db,
        rfq_id=rfq_id,
        user_id=current_user.id,
        is_staff=False,
        reason=reason,
    )


@rfq_router.post(
    "/{rfq_id}/request-revision",
    response_model=RFQResponse,
    summary="Request Quotation Revision",
    description="Customer requests a revised quote with adjusted pricing, specifications, or quantities.",
)
def request_revision(
    rfq_id: str,
    payload: RFQRevisionRequest,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return wholesale_service.request_revision(
        db=db,
        rfq_id=rfq_id,
        user_id=current_user.id,
        revision_in=payload,
    )


@rfq_router.get(
    "/{rfq_id}/quotes",
    response_model=List[QuoteResponse],
    summary="List Quotation Revisions for RFQ",
    description="Retrieves all versioned quotes generated for this RFQ.",
)
def list_rfq_quotes(
    rfq_id: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return wholesale_service.list_rfq_quotes(
        db=db,
        rfq_id=rfq_id,
        user_id=current_user.id,
        is_staff=False,
    )


# ============================================================================
# CUSTOMER QUOTATION ENDPOINTS
# ============================================================================

@quote_router.get(
    "/{quote_id}",
    response_model=QuoteResponse,
    summary="Get Quotation Details",
    description="Returns detailed financial breakdown and line items for an institutional quote.",
)
def get_quote_detail(
    quote_id: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    return wholesale_service.get_quote(
        db=db,
        quote_id_or_number=quote_id,
        user_id=current_user.id,
        is_staff=False,
    )


@quote_router.post(
    "/{quote_id}/accept",
    response_model=dict,
    summary="Accept Quotation & Create Wholesale Order",
    description="Customer accepts an active quotation. Atomically creates a real Phase 2E PostgreSQL Order and deducts inventory with row locks.",
)
def accept_quotation(
    quote_id: str,
    payment_method: str = Query("online", description="Selected payment method"),
    notes: Optional[str] = Query(None, description="Order delivery instructions"),
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    result = wholesale_service.accept_quote(
        db=db,
        quote_id=quote_id,
        customer_user=current_user,
        payment_method=payment_method,
        notes=notes,
    )
    return {
        "message": "Quotation accepted successfully. Order created.",
        "quote": QuoteResponse.model_validate(result["quote"]),
        "order": OrderResponse.model_validate(result["order"]),
    }


@quote_router.post(
    "/{quote_id}/reject",
    response_model=QuoteResponse,
    summary="Reject Quotation",
    description="Customer declines an institutional quotation.",
)
def reject_quotation(
    quote_id: str,
    payload: Optional[QuoteRejectRequest] = None,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    reject_in = payload or QuoteRejectRequest()
    return wholesale_service.reject_quote(
        db=db,
        quote_id=quote_id,
        customer_user=current_user,
        reject_in=reject_in,
    )


# ============================================================================
# STAFF / PROCUREMENT RFQ MANAGEMENT ENDPOINTS
# ============================================================================

@admin_rfq_router.get(
    "",
    response_model=RFQListResponse,
    summary="Admin: List RFQ Queue",
    description="Staff endpoint to search, filter, and inspect all institutional RFQ inquiries across all customers.",
)
def admin_list_rfqs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    search: Optional[str] = Query(None, description="Search query by project, RFQ number or GSTIN"),
    current_user: User = Depends(require_permission(Permission.QUOTES_VIEW)),
    db: Session = Depends(get_db),
):
    skip = (page - 1) * page_size
    items, total = wholesale_service.list_admin_rfqs(
        db=db,
        skip=skip,
        limit=page_size,
        status_filter=status,
        search=search,
    )
    total_pages = (total + page_size - 1) // page_size if total > 0 else 1
    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages,
    }


@admin_rfq_router.get(
    "/{rfq_id}",
    response_model=RFQResponse,
    summary="Admin: Get RFQ Details",
    description="Staff endpoint to view complete RFQ details, customer identity, and quotation revisions.",
)
def admin_get_rfq(
    rfq_id: str,
    current_user: User = Depends(require_permission(Permission.QUOTES_VIEW)),
    db: Session = Depends(get_db),
):
    return wholesale_service.get_rfq(
        db=db,
        rfq_id_or_number=rfq_id,
        is_staff=True,
    )


@admin_rfq_router.patch(
    "/{rfq_id}/status",
    response_model=RFQResponse,
    summary="Admin: Update RFQ Status",
    description="Staff endpoint to update RFQ stage with state machine transition checks.",
)
def admin_update_rfq_status(
    rfq_id: str,
    payload: RFQStatusUpdateRequest,
    current_user: User = Depends(require_permission(Permission.QUOTES_MANAGE)),
    db: Session = Depends(get_db),
):
    return wholesale_service.update_rfq_status(
        db=db,
        rfq_id=rfq_id,
        update_in=payload,
        staff_user=current_user,
    )


@admin_rfq_router.post(
    "/{rfq_id}/quotes",
    response_model=QuoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin: Generate Quotation for RFQ",
    description="Procurement manager creates a priced quotation with server-calculated subtotals, taxes, and discounts.",
)
def admin_create_quote(
    rfq_id: str,
    payload: QuoteCreateRequest,
    current_user: User = Depends(require_permission(Permission.QUOTES_MANAGE)),
    db: Session = Depends(get_db),
):
    return wholesale_service.create_quote(
        db=db,
        rfq_id=rfq_id,
        staff_user=current_user,
        quote_in=payload,
    )


# ============================================================================
# STAFF / PROCUREMENT QUOTATION MANAGEMENT ENDPOINTS
# ============================================================================

@admin_quote_router.patch(
    "/{quote_id}",
    response_model=QuoteResponse,
    summary="Admin: Update Quotation",
    description="Staff endpoint to update draft quote parameters before dispatching.",
)
def admin_update_quote(
    quote_id: str,
    payload: QuoteUpdateRequest,
    current_user: User = Depends(require_permission(Permission.QUOTES_MANAGE)),
    db: Session = Depends(get_db),
):
    # Retrieve quote and update fields
    quote = wholesale_service.get_quote(db, quote_id, is_staff=True)
    if payload.valid_until is not None:
        quote.valid_until = payload.valid_until
    if payload.customer_notes is not None:
        quote.customer_notes = payload.customer_notes
    if payload.procurement_notes is not None:
        quote.procurement_notes = payload.procurement_notes
    if payload.delivery_charge is not None:
        quote.delivery_charge = payload.delivery_charge
    if payload.discount_amount is not None:
        quote.discount_amount = payload.discount_amount

    # Recalculate total
    quote.total = quote.subtotal - quote.discount_amount + quote.tax_amount + quote.delivery_charge
    db.commit()
    db.refresh(quote)
    return quote


@admin_quote_router.post(
    "/{quote_id}/send",
    response_model=QuoteResponse,
    summary="Admin: Send Quotation to Customer",
    description="Publishes quotation from DRAFT to SENT status.",
)
def admin_send_quote(
    quote_id: str,
    current_user: User = Depends(require_permission(Permission.QUOTES_MANAGE)),
    db: Session = Depends(get_db),
):
    return wholesale_service.send_quote(
        db=db,
        quote_id=quote_id,
        staff_user=current_user,
    )


@admin_quote_router.post(
    "/{quote_id}/revise",
    response_model=QuoteResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Admin: Create Revised Quotation",
    description="Creates a new sequential revision (e.g. v2) for a negotiated quotation.",
)
def admin_revise_quote(
    quote_id: str,
    payload: QuoteCreateRequest,
    current_user: User = Depends(require_permission(Permission.QUOTES_MANAGE)),
    db: Session = Depends(get_db),
):
    return wholesale_service.revise_quote(
        db=db,
        quote_id=quote_id,
        staff_user=current_user,
        quote_in=payload,
    )


@admin_quote_router.post(
    "/{quote_id}/expire",
    response_model=QuoteResponse,
    summary="Admin: Expire Quotation",
    description="Marks unaccepted quotation as EXPIRED.",
)
def admin_expire_quote(
    quote_id: str,
    current_user: User = Depends(require_permission(Permission.QUOTES_MANAGE)),
    db: Session = Depends(get_db),
):
    return wholesale_service.expire_quote(
        db=db,
        quote_id=quote_id,
        staff_user=current_user,
    )
