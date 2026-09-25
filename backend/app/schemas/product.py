from datetime import datetime
from decimal import Decimal
from typing import Any, List, Optional, Union, Dict
from pydantic import BaseModel, Field, field_validator
from app.schemas.category import CategoryResponse


class ProductSpecification(BaseModel):
    key: str
    value: str


class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    slug: str = Field(..., min_length=1, max_length=255)
    sku: Optional[str] = Field(None, max_length=50)
    brand: str = Field(..., min_length=1, max_length=100)
    category_id: str = Field(..., min_length=1, max_length=36)
    subcategory: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Decimal = Field(..., ge=0)
    mrp: Decimal = Field(..., ge=0)
    discount_percent: int = Field(default=0, ge=0, le=100)
    unit: str = Field(default="Piece", max_length=30)
    rating: float = Field(default=0.0, ge=0.0, le=5.0)
    review_count: int = Field(default=0, ge=0)
    bulk_price: Optional[Decimal] = Field(None, ge=0)
    minimum_bulk_quantity: Optional[int] = Field(None, ge=1)
    delivery_available: bool = True
    is_featured: bool = False
    is_new: bool = False
    is_offer: bool = False
    is_active: bool = True
    images: List[str] = Field(default_factory=list)
    specifications: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = Field(default_factory=list)
    features: List[str] = Field(default_factory=list)

    @field_validator("slug")
    @classmethod
    def clean_slug(cls, v: str) -> str:
        return v.lower().strip()


class ProductCreate(ProductBase):
    initial_stock: Optional[int] = Field(default=0, ge=0)


class ProductUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    slug: Optional[str] = Field(None, min_length=1, max_length=255)
    sku: Optional[str] = Field(None, max_length=50)
    brand: Optional[str] = Field(None, min_length=1, max_length=100)
    category_id: Optional[str] = Field(None, min_length=1, max_length=36)
    subcategory: Optional[str] = None
    description: Optional[str] = None
    short_description: Optional[str] = None
    price: Optional[Decimal] = Field(None, ge=0)
    mrp: Optional[Decimal] = Field(None, ge=0)
    discount_percent: Optional[int] = Field(None, ge=0, le=100)
    unit: Optional[str] = None
    rating: Optional[float] = Field(None, ge=0.0, le=5.0)
    review_count: Optional[int] = Field(None, ge=0)
    bulk_price: Optional[Decimal] = None
    minimum_bulk_quantity: Optional[int] = None
    delivery_available: Optional[bool] = None
    is_featured: Optional[bool] = None
    is_new: Optional[bool] = None
    is_offer: Optional[bool] = None
    is_active: Optional[bool] = None
    images: Optional[List[str]] = None
    specifications: Optional[Union[List[Dict[str, Any]], Dict[str, Any]]] = None
    features: Optional[List[str]] = None

    @field_validator("slug")
    @classmethod
    def clean_slug(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.lower().strip()
        return v


class ProductListItem(BaseModel):
    id: str
    name: str
    slug: str
    sku: Optional[str] = None
    brand: str
    category_id: str
    category_slug: Optional[str] = None
    category_name: Optional[str] = None
    subcategory: Optional[str] = None
    description: Optional[str] = None
    price: Decimal
    mrp: Decimal
    discount_percent: int
    unit: str
    rating: float
    review_count: int
    bulk_price: Optional[Decimal] = None
    minimum_bulk_quantity: Optional[int] = None
    delivery_available: bool
    is_featured: bool
    is_new: bool
    is_offer: bool
    is_active: bool
    images: List[str] = Field(default_factory=list)
    specifications: Optional[Any] = Field(default_factory=list)
    features: List[str] = Field(default_factory=list)
    stock: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductDetailResponse(ProductListItem):
    category: Optional[CategoryResponse] = None
    available_stock: int = 0
    reserved_stock: int = 0


class ProductListResponse(BaseModel):
    items: List[ProductListItem]
    page: int
    page_size: int
    total: int
    total_pages: int
