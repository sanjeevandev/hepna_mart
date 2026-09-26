from typing import List, Optional, Dict, Any
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class CreatePaymentRequest(BaseModel):
    order_id: str
    payment_method: str = "upi"
    provider: Optional[str] = None


class SubmitUPIRequest(BaseModel):
    utr_reference: str = Field(..., min_length=4, max_length=64, description="UPI Transaction / UTR reference ID")


class VerifyPaymentRequest(BaseModel):
    notes: Optional[str] = None


class RejectPaymentRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="Mandatory rejection reason")


class RefundPaymentRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="Refund explanation")
    amount: Optional[Decimal] = None


class PaymentEventResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    payment_id: str
    event_type: str
    old_status: Optional[str] = None
    new_status: str
    provider_event_id: Optional[str] = None
    metadata_payload: Optional[Dict[str, Any]] = Field(default=None, serialization_alias="metadata")
    created_by_user_id: Optional[str] = None
    created_at: datetime


class PaymentOrderSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_number: str
    customer_name: str
    customer_email: str
    customer_phone: Optional[str] = None
    total_amount: Decimal
    payment_status: str
    status: str


class PaymentResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_id: str
    user_id: str
    payment_reference: Optional[str] = None
    provider_reference: Optional[str] = None
    provider: str
    payment_method: str
    payment_status: str
    amount: Decimal
    currency: str
    failure_reason: Optional[str] = None
    verified_by_user_id: Optional[str] = None
    verified_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    order: Optional[PaymentOrderSummary] = None
    events: Optional[List[PaymentEventResponse]] = None


class PaymentListResponse(BaseModel):
    payments: List[PaymentResponse]
    total: int
    page: int
    limit: int


class PaymentMetricsResponse(BaseModel):
    pending_verification: int
    verified_today: int
    failed_payments: int
    cod_orders: int
    upi_volume: float
    refund_pending: int
    total_payments: int


class PaymentConfigResponse(BaseModel):
    upi_id: str
    upi_display_name: str
    upi_qr_path: str
    currency: str
    manual_upi_enabled: bool
    cod_enabled: bool
    gateway_enabled: bool
