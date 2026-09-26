from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict, model_validator

from app.models.wholesale import RFQStatus, QuoteStatus


class RFQDeliveryAddress(BaseModel):
    model_config = ConfigDict(extra="ignore")

    full_name: str = Field(..., min_length=2, max_length=255)
    phone: str = Field(..., min_length=7, max_length=30)
    address_line1: str = Field(..., min_length=3, max_length=255)
    address_line2: Optional[str] = Field(None, max_length=255)
    city: str = Field(..., min_length=2, max_length=100)
    district: Optional[str] = Field(None, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., min_length=5, max_length=10)
    is_construction_site: bool = True
    site_name: Optional[str] = Field(None, max_length=255)
    site_type: Optional[str] = Field(None, max_length=100)
    delivery_preference: Optional[str] = Field(None, max_length=100)
    site_contact_person: Optional[str] = Field(None, max_length=255)
    site_phone: Optional[str] = Field(None, max_length=30)
    access_road: Optional[str] = Field(None, max_length=100)
    vehicle_access: Optional[str] = Field(None, max_length=100)
    delivery_instructions: Optional[str] = Field(None, max_length=1000)


class RFQItemCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    product_id: Optional[str] = None
    product_name: str = Field(..., min_length=2, max_length=255)
    product_sku: Optional[str] = Field(None, max_length=64)
    brand: Optional[str] = Field(None, max_length=128)
    unit: Optional[str] = Field("Pieces", max_length=32)
    requested_quantity: int = Field(..., gt=0)
    target_unit_price: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    notes: Optional[str] = Field(None, max_length=1000)


class RFQCreateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    project_id: Optional[str] = Field(None, max_length=64)
    project_name: Optional[str] = Field(None, max_length=255)
    project_type: Optional[str] = Field(None, max_length=64)
    required_by_date: Optional[str] = Field(None, max_length=64)
    delivery_address: RFQDeliveryAddress
    gstin: Optional[str] = Field(None, max_length=32)
    notes: Optional[str] = Field(None, max_length=2000)
    items: List[RFQItemCreate] = Field(..., min_length=1)
    submit_now: bool = True  # If True, status begins as SUBMITTED; if False, DRAFT


class RFQItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    rfq_id: str
    product_id: Optional[str] = None
    product_name: str
    product_sku: Optional[str] = None
    brand: Optional[str] = None
    unit: Optional[str] = None
    requested_quantity: int
    target_unit_price: Optional[Decimal] = None
    notes: Optional[str] = None
    created_at: datetime


class RFQStatusHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    rfq_id: str
    old_status: Optional[str] = None
    new_status: str
    changed_by_user_id: Optional[str] = None
    title: str
    description: Optional[str] = None
    created_at: datetime


class QuoteItemCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    rfq_item_id: Optional[str] = None
    product_id: Optional[str] = None
    product_name: Optional[str] = None
    product_sku: Optional[str] = None
    brand: Optional[str] = None
    unit: Optional[str] = None
    requested_quantity: int = Field(..., gt=0)
    quoted_quantity: int = Field(..., gt=0)
    quoted_unit_price: Decimal = Field(..., ge=Decimal("0.00"))
    discount_amount: Optional[Decimal] = Field(Decimal("0.00"), ge=Decimal("0.00"))
    tax_amount: Optional[Decimal] = None


class QuoteItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    quote_id: str
    rfq_item_id: Optional[str] = None
    product_id: Optional[str] = None
    product_name: str
    product_sku: Optional[str] = None
    brand: Optional[str] = None
    unit: Optional[str] = None
    requested_quantity: int
    quoted_quantity: int
    catalog_unit_price_at_quote: Decimal
    quoted_unit_price: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    line_subtotal: Decimal
    line_total: Decimal


class QuoteResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    quote_number: str
    rfq_id: str
    version: int
    status: str
    subtotal: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    delivery_charge: Decimal
    total: Decimal
    valid_until: Optional[datetime] = None
    customer_notes: Optional[str] = None
    procurement_notes: Optional[str] = None
    created_by_user_id: Optional[str] = None
    items: List[QuoteItemResponse] = []
    created_at: datetime
    updated_at: datetime


class QuoteCreateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    items: List[QuoteItemCreate] = Field(..., min_length=1)
    delivery_charge: Optional[Decimal] = Field(Decimal("0.00"), ge=Decimal("0.00"))
    discount_amount: Optional[Decimal] = Field(Decimal("0.00"), ge=Decimal("0.00"))
    valid_until: Optional[datetime] = None
    customer_notes: Optional[str] = Field(None, max_length=2000)
    procurement_notes: Optional[str] = Field(None, max_length=2000)
    send_now: bool = True  # If True, sets status to SENT directly; else DRAFT


class QuoteUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    items: Optional[List[QuoteItemCreate]] = None
    delivery_charge: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    discount_amount: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    valid_until: Optional[datetime] = None
    customer_notes: Optional[str] = Field(None, max_length=2000)
    procurement_notes: Optional[str] = Field(None, max_length=2000)


class QuoteRejectRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    reason: Optional[str] = Field(None, max_length=1000)


class RFQRevisionRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    notes: str = Field(..., min_length=2, max_length=2000)
    items: Optional[List[RFQItemCreate]] = None


class RFQStatusUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    status: RFQStatus
    notes: Optional[str] = Field(None, max_length=1000)


class RFQResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    rfq_number: str
    user_id: str
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    project_type: Optional[str] = None
    required_by_date: Optional[str] = None
    delivery_address: Dict[str, Any] = {}
    gstin: Optional[str] = None
    notes: Optional[str] = None
    status: str
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    items: List[RFQItemResponse] = []
    status_history: List[RFQStatusHistoryResponse] = []
    quotes: List[QuoteResponse] = []
    latest_quote: Optional[QuoteResponse] = None


class RFQListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[RFQResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class QuoteListResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    items: List[QuoteResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
