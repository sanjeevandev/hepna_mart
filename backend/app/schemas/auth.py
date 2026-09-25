from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, field_validator
from app.models.user import AccountType, UserRole


class RegisterRequest(BaseModel):
    """
    Public customer registration payload.
    Public registration is strictly constrained to customer account creation.
    """
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = Field(None, max_length=30)
    account_type: AccountType = Field(default=AccountType.INDIVIDUAL)
    company_name: Optional[str] = Field(None, max_length=255)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()

    @field_validator("first_name", "last_name")
    @classmethod
    def clean_names(cls, v: str) -> str:
        return v.strip()


class LoginRequest(BaseModel):
    """
    User login credentials payload.
    """
    email: EmailStr
    password: str = Field(..., min_length=1)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()


class UserResponse(BaseModel):
    """
    Safe public user representation. Never exposes password_hash.
    """
    id: str
    email: str
    first_name: str
    last_name: str
    full_name: str
    phone: Optional[str] = None
    company_name: Optional[str] = None
    account_type: AccountType
    role: UserRole
    is_staff: bool
    is_active: bool
    is_email_verified: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class CurrentUserResponse(UserResponse):
    """
    Detailed profile for the active session, including authoritative permissions.
    """
    permissions: List[str] = Field(default_factory=list)


class TokenResponse(BaseModel):
    """
    Authentication success token response.
    """
    access_token: str
    token_type: str = "bearer"
    expires_in: int
    user: UserResponse


class ChangePasswordRequest(BaseModel):
    """
    Authenticated password change payload.
    """
    current_password: str = Field(..., min_length=1)
    new_password: str = Field(..., min_length=8, max_length=128)


class StaffCreateUserRequest(BaseModel):
    """
    Staff-only user provisioning schema.
    """
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = None
    account_type: AccountType = AccountType.BUSINESS
    role: UserRole
    company_name: Optional[str] = None

    @field_validator("email")
    @classmethod
    def normalize_email(cls, v: str) -> str:
        return v.lower().strip()
