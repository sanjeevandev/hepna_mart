from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class EstimateCreateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    inputs: Dict[str, Any] = Field(...)
    materials: Optional[List[Dict[str, Any]]] = None
    subtotal_at_estimate: Optional[Decimal] = None
    tax_at_estimate: Optional[Decimal] = None
    delivery_at_estimate: Optional[Decimal] = None
    total_at_estimate: Optional[Decimal] = None
    validity_days: int = Field(7, ge=1, le=90)
    notes: Optional[str] = Field(None, max_length=2000)
    project_id: Optional[str] = Field(None, max_length=64)


class EstimateUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    notes: Optional[str] = Field(None, max_length=2000)
    project_id: Optional[str] = Field(None, max_length=64)


class TransferToProjectRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    target_project_id: str = Field(..., min_length=1, max_length=64)


class EstimateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    project_id: Optional[str] = None
    project_type: str
    built_up_area: float
    area_unit: str
    floors: int
    quality: str
    city: str
    project_name: Optional[str] = None
    inputs: Dict[str, Any]
    materials: List[Dict[str, Any]]
    subtotal_at_estimate: float
    tax_at_estimate: float
    delivery_at_estimate: float
    total_at_estimate: float
    current_subtotal: float
    current_tax: float
    current_delivery: float
    current_total: float
    price_difference: float
    has_price_changes: bool
    validity_days: int
    price_snapshot_timestamp: datetime
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class EstimateListResponse(BaseModel):
    estimates: List[EstimateResponse]
    total: int
