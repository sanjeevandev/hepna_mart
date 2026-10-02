from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, EmailStr
from app.models.organization import OrgRole


class OrganizationBase(BaseModel):
    name: str = Field(..., min_length=2, max_length=255, description="Organization or Enterprise Name")
    business_type: str = Field("Proprietorship", max_length=100, description="Entity Type")
    slug: Optional[str] = Field(None, max_length=255, description="URL-friendly identifier")


class OrganizationCreate(OrganizationBase):
    pass


class OrganizationUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=255)
    business_type: Optional[str] = Field(None, max_length=100)
    slug: Optional[str] = Field(None, max_length=255)
    is_active: Optional[bool] = None


class OrganizationMemberResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    user_id: str
    role: OrgRole
    email: Optional[str] = None
    name: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class OrganizationMemberUpdateRole(BaseModel):
    role: OrgRole = Field(..., description="Updated organizational role")


class OrganizationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    name: str
    owner_id: str
    slug: Optional[str] = None
    business_type: str
    is_active: bool
    current_user_role: Optional[OrgRole] = None
    member_count: Optional[int] = None
    created_at: datetime
    updated_at: datetime


class InvitationCreate(BaseModel):
    email: EmailStr = Field(..., description="Email address of the invited user")
    role: OrgRole = Field(OrgRole.VIEWER, description="Role assigned upon invitation acceptance")


class InvitationResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    organization_id: str
    invited_by_user_id: str
    email: str
    role: OrgRole
    token: Optional[str] = None  # Returned only on creation/creator view, never exposed publicly
    status: str
    expires_at: datetime
    created_at: datetime
    updated_at: datetime


class InvitationAcceptRequest(BaseModel):
    token: str = Field(..., description="Invitation token to accept")
