from typing import List, Optional, Dict, Any
from decimal import Decimal
from datetime import datetime
from pydantic import BaseModel, Field, ConfigDict

from app.models.order import OrderStatus, PaymentStatus, PaymentMethod


class CheckoutDeliveryRequest(BaseModel):
    id: Optional[str] = None
    full_name: str = Field(..., description="Customer / billing contact full name")
    phone: str = Field(..., description="Contact phone number")
    address_line1: str = Field(..., description="Primary street / plot address")
    address_line2: Optional[str] = Field(None, description="Landmark / secondary address")
    city: str = Field(..., description="City name")
    district: Optional[str] = None
    state: str = Field(default="Maharashtra", description="State name")
    pincode: str = Field(..., description="6-digit postal pincode")
    landmark: Optional[str] = None
    is_construction_site: bool = Field(default=True, description="Whether this is a construction site drop")
    site_name: Optional[str] = Field(None, description="Construction site or project name")
    site_type: Optional[str] = Field(None, description="Site category e.g. Residential Villa, Commercial")
    delivery_preference: Optional[str] = Field(None, description="Logistics vehicle preference")
    required_delivery_date: Optional[str] = Field(None, description="Target arrival date")
    site_contact_person: Optional[str] = Field(None, description="Site engineer / supervisor name")
    site_phone: Optional[str] = Field(None, description="Site supervisor phone")
    delivery_instructions: Optional[str] = Field(None, description="Gate pass or unloading notes")
    access_road: Optional[str] = Field(None, description="Road width & surface condition")
    vehicle_access: Optional[str] = Field(None, description="Allowed vehicle types e.g. 10-wheeler")
    unloading_required: Optional[bool] = False
    supervisor_name: Optional[str] = None
    supervisor_phone: Optional[str] = None
    gate_instructions: Optional[str] = None
    delivery_notes: Optional[str] = None


class CheckoutItemRequest(BaseModel):
    product_id: str = Field(..., description="Product UUID")
    quantity: int = Field(..., gt=0, description="Quantity to order")


class CheckoutRequest(BaseModel):
    items: Optional[List[CheckoutItemRequest]] = Field(
        None,
        description="Specific items to check out. If omitted, checks out all items currently in user's cart.",
    )
    delivery_address: CheckoutDeliveryRequest = Field(..., description="Delivery & site destination snapshot")
    payment_method: str = Field(default="online", description="Payment method: online, cod, upi, card, netbanking")
    customer_name: Optional[str] = Field(None, description="Customer name snapshot override")
    customer_email: Optional[str] = Field(None, description="Customer email snapshot override")
    customer_phone: Optional[str] = Field(None, description="Customer phone snapshot override")
    project_id: Optional[str] = Field(None, description="Linked construction project ID")
    project_name: Optional[str] = Field(None, description="Linked project title")
    notes: Optional[str] = Field(None, description="General order instructions")


class OrderItemResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_id: str
    product_id: Optional[str]
    product_name: str
    product_sku: Optional[str]
    product_image: Optional[str]
    brand: Optional[str]
    unit: Optional[str]
    quantity: int
    unit_price: Decimal
    mrp: Decimal
    discount_amount: Decimal
    tax_amount: Decimal
    subtotal: Decimal
    total: Decimal
    created_at: datetime


class OrderStatusHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    old_status: Optional[str]
    new_status: str
    title: str
    description: Optional[str]
    note: Optional[str]
    completed: bool
    active: bool
    created_at: datetime


class OrderResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    order_number: str
    status: str
    payment_status: str
    payment_method: str
    subtotal: Decimal
    tax_amount: Decimal
    delivery_charge: Decimal
    discount_amount: Decimal
    total_amount: Decimal
    currency: str
    customer_name: str
    customer_email: str
    customer_phone: str
    notes: Optional[str] = None
    cancellation_reason: Optional[str] = None
    cancelled_at: Optional[datetime] = None
    estimated_delivery: Optional[str] = None
    delivery_window: Optional[str] = None
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    quotation_id: Optional[str] = None
    delivery_address: Dict[str, Any]
    items: List[OrderItemResponse] = []
    status_history: List[OrderStatusHistoryResponse] = []
    created_at: datetime
    updated_at: datetime


class OrderListResponse(BaseModel):
    orders: List[OrderResponse]
    total_count: int


class OrderStatusUpdateRequest(BaseModel):
    status: OrderStatus
    title: Optional[str] = None
    description: Optional[str] = None
    note: Optional[str] = None


class CancelOrderRequest(BaseModel):
    reason: str = Field(..., min_length=3, description="Cancellation reason description")


class ReorderResponse(BaseModel):
    added_count: int
    unavailable_items: List[str] = []
    message: str
