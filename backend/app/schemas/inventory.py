from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator


class InventoryBase(BaseModel):
    quantity: int = Field(default=0, ge=0)
    reserved_quantity: int = Field(default=0, ge=0)
    low_stock_threshold: int = Field(default=10, ge=0)
    warehouse: str = Field(default="MAIN", max_length=50)
    location: Optional[str] = Field(None, max_length=100)


class InventoryUpdate(BaseModel):
    quantity: Optional[int] = Field(None, ge=0)
    reserved_quantity: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)
    warehouse: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=100)


class InventoryResponse(BaseModel):
    id: str
    product_id: str
    quantity: int
    reserved_quantity: int
    available_quantity: int
    low_stock_threshold: int
    warehouse: str
    location: Optional[str] = None
    status: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class InventoryListItem(InventoryResponse):
    product_name: Optional[str] = None
    product_slug: Optional[str] = None
    product_sku: Optional[str] = None
    category_name: Optional[str] = None
    category_slug: Optional[str] = None
