from datetime import datetime
from decimal import Decimal
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, ConfigDict

from app.models.organization import OrgRole


class ProjectMaterialBase(BaseModel):
    model_config = ConfigDict(extra="ignore")

    product_id: str = Field(..., min_length=1, max_length=64)
    quantity: Decimal = Field(..., gt=Decimal("0.00"))
    unit: str = Field("Piece", max_length=32)
    stage: Optional[str] = Field("Foundation", max_length=64)
    wastage_percent: Decimal = Field(Decimal("0.00"), ge=Decimal("0.00"), le=Decimal("50.00"))
    purchased_quantity: Decimal = Field(Decimal("0.00"), ge=Decimal("0.00"))
    price_at_addition: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    notes: Optional[str] = Field(None, max_length=1000)


class ProjectMaterialCreate(ProjectMaterialBase):
    pass


class ProjectMaterialUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    quantity: Optional[Decimal] = Field(None, gt=Decimal("0.00"))
    unit: Optional[str] = Field(None, max_length=32)
    stage: Optional[str] = Field(None, max_length=64)
    wastage_percent: Optional[Decimal] = Field(None, ge=Decimal("0.00"), le=Decimal("50.00"))
    purchased_quantity: Optional[Decimal] = Field(None, ge=Decimal("0.00"))
    notes: Optional[str] = Field(None, max_length=1000)


class ProjectMaterialResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    product_id: str
    quantity: float
    unit: str
    purchased_quantity: float
    wastage_percent: float
    stage: Optional[str] = None
    price_at_addition: float
    notes: Optional[str] = None
    added_at: datetime
    created_at: Optional[datetime] = None
    updated_at: datetime


class ProjectMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    project_id: str
    user_id: str
    role: OrgRole
    email: Optional[str] = None
    name: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class ProjectMemberAddRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    user_id: str = Field(..., min_length=1, max_length=36)
    role: OrgRole = Field(OrgRole.VIEWER)


class ProjectMemberUpdateRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    role: OrgRole


class ProjectTransferRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")

    target_organization_id: Optional[str] = Field(None, max_length=36)


class ProjectCreate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: str = Field(..., min_length=2, max_length=255)
    organization_id: Optional[str] = Field(None, max_length=36)
    project_type: str = Field("House", max_length=64)
    built_up_area: Decimal = Field(..., gt=Decimal("0.00"))
    area_unit: str = Field("sq.ft", max_length=32)
    floors: int = Field(1, ge=1, le=50)
    stage: str = Field("Foundation", max_length=64)
    city: str = Field("Pune", min_length=2, max_length=100)
    pincode: str = Field("411001", min_length=5, max_length=10)


class ProjectUpdate(BaseModel):
    model_config = ConfigDict(extra="ignore")

    name: Optional[str] = Field(None, min_length=2, max_length=255)
    organization_id: Optional[str] = Field(None, max_length=36)
    project_type: Optional[str] = Field(None, max_length=64)
    built_up_area: Optional[Decimal] = Field(None, gt=Decimal("0.00"))
    area_unit: Optional[str] = Field(None, max_length=32)
    floors: Optional[int] = Field(None, ge=1, le=50)
    stage: Optional[str] = Field(None, max_length=64)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    pincode: Optional[str] = Field(None, min_length=5, max_length=10)
    completed_stages: Optional[List[str]] = None


class ProjectResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    organization_id: Optional[str] = None
    organization_name: Optional[str] = None
    current_user_role: Optional[OrgRole] = None
    member_count: int = 0
    is_shared: bool = False
    name: str
    project_type: str
    built_up_area: float
    area_unit: str
    floors: int
    stage: str
    city: str
    pincode: str
    completed_stages: List[str]
    materials: List[ProjectMaterialResponse] = []
    members: List[ProjectMemberResponse] = []
    created_at: datetime
    updated_at: datetime


class ProjectListResponse(BaseModel):
    projects: List[ProjectResponse]
    total: int
