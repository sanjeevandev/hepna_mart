from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    slug: str = Field(..., min_length=1, max_length=120)
    description: Optional[str] = None
    tagline: Optional[str] = None
    icon: Optional[str] = None
    image: Optional[str] = None
    parent_id: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0
    subcategories: Optional[List[str]] = Field(default_factory=list)

    @field_validator("slug")
    @classmethod
    def clean_slug(cls, v: str) -> str:
        return v.lower().strip()


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=100)
    slug: Optional[str] = Field(None, min_length=1, max_length=120)
    description: Optional[str] = None
    tagline: Optional[str] = None
    icon: Optional[str] = None
    image: Optional[str] = None
    parent_id: Optional[str] = None
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None
    subcategories: Optional[List[str]] = None

    @field_validator("slug")
    @classmethod
    def clean_slug(cls, v: Optional[str]) -> Optional[str]:
        if v is not None:
            return v.lower().strip()
        return v


class CategoryResponse(CategoryBase):
    id: str
    product_count: Optional[int] = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CategoryListItem(BaseModel):
    id: str
    name: str
    slug: str
    description: Optional[str] = None
    tagline: Optional[str] = None
    icon: Optional[str] = None
    image: Optional[str] = None
    parent_id: Optional[str] = None
    is_active: bool
    sort_order: int
    subcategories: Optional[List[str]] = Field(default_factory=list)
    product_count: int = 0

    model_config = {"from_attributes": True}
