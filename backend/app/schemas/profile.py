import re
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, Field, field_validator

# Indian GSTIN format regex (15 characters: 2 state code + 10 PAN + 1 entity code + 1 Z + 1 checksum)
GSTIN_REGEX = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$")

# Indian PAN format regex (10 characters: 5 letters + 4 digits + 1 letter)
PAN_REGEX = re.compile(r"^[A-Z]{5}[0-9]{4}[A-Z]{1}$")


class BusinessProfileBase(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=255, description="Registered entity or trade name")
    business_type: str = Field(default="Private Limited Company", max_length=100)
    gstin: Optional[str] = Field(None, max_length=15, description="15-digit Indian GSTIN")
    pan: Optional[str] = Field(None, max_length=10, description="10-digit Indian Permanent Account Number")
    registered_address: str = Field(..., min_length=5, max_length=500)
    city: str = Field(..., min_length=2, max_length=100)
    state: str = Field(..., min_length=2, max_length=100)
    pincode: str = Field(..., min_length=6, max_length=10)
    contact_person: str = Field(..., min_length=2, max_length=255)
    contact_phone: str = Field(..., min_length=7, max_length=30)
    contact_email: Optional[str] = Field(None, max_length=255)

    @field_validator("gstin", mode="before")
    @classmethod
    def validate_gstin(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip().upper()
        if not cleaned:
            return None
        if not GSTIN_REGEX.match(cleaned):
            raise ValueError(
                "Invalid GSTIN format. Expected 15-character alphanumeric Indian GSTIN format (e.g. 27AAAAA0000A1Z5)."
            )
        return cleaned

    @field_validator("pan", mode="before")
    @classmethod
    def validate_pan(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip().upper()
        if not cleaned:
            return None
        if not PAN_REGEX.match(cleaned):
            raise ValueError(
                "Invalid PAN format. Expected 10-character alphanumeric Indian PAN format (e.g. AAAAA0000A)."
            )
        return cleaned


class BusinessProfileCreate(BusinessProfileBase):
    pass


class BusinessProfileUpdate(BaseModel):
    business_name: Optional[str] = Field(None, min_length=2, max_length=255)
    business_type: Optional[str] = Field(None, max_length=100)
    gstin: Optional[str] = Field(None, max_length=15)
    pan: Optional[str] = Field(None, max_length=10)
    registered_address: Optional[str] = Field(None, min_length=5, max_length=500)
    city: Optional[str] = Field(None, min_length=2, max_length=100)
    state: Optional[str] = Field(None, min_length=2, max_length=100)
    pincode: Optional[str] = Field(None, min_length=6, max_length=10)
    contact_person: Optional[str] = Field(None, min_length=2, max_length=255)
    contact_phone: Optional[str] = Field(None, min_length=7, max_length=30)
    contact_email: Optional[str] = Field(None, max_length=255)

    @field_validator("gstin", mode="before")
    @classmethod
    def validate_gstin(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip().upper()
        if not cleaned:
            return None
        if not GSTIN_REGEX.match(cleaned):
            raise ValueError(
                "Invalid GSTIN format. Expected 15-character alphanumeric Indian GSTIN format (e.g. 27AAAAA0000A1Z5)."
            )
        return cleaned

    @field_validator("pan", mode="before")
    @classmethod
    def validate_pan(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return None
        cleaned = v.strip().upper()
        if not cleaned:
            return None
        if not PAN_REGEX.match(cleaned):
            raise ValueError(
                "Invalid PAN format. Expected 10-character alphanumeric Indian PAN format (e.g. AAAAA0000A)."
            )
        return cleaned


class BusinessProfileResponse(BusinessProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    tax_verification_status: str
    tax_verification_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime


class ContractorProfileBase(BaseModel):
    business_name: str = Field(..., min_length=2, max_length=255, description="Contractor trading / firm name")
    specialization: List[str] = Field(default_factory=list, description="List of trade specializations")
    years_of_experience: int = Field(default=1, ge=0, le=100, description="Years in construction / trade")
    service_area: str = Field(default="Local District", max_length=255)
    license_number: Optional[str] = Field(None, max_length=100)
    project_count: int = Field(default=0, ge=0)
    preferred_materials: List[str] = Field(default_factory=list)


class ContractorProfileCreate(ContractorProfileBase):
    pass


class ContractorProfileUpdate(BaseModel):
    business_name: Optional[str] = Field(None, min_length=2, max_length=255)
    specialization: Optional[List[str]] = None
    years_of_experience: Optional[int] = Field(None, ge=0, le=100)
    service_area: Optional[str] = Field(None, max_length=255)
    license_number: Optional[str] = Field(None, max_length=100)
    project_count: Optional[int] = Field(None, ge=0)
    preferred_materials: Optional[List[str]] = None


class ContractorProfileResponse(ContractorProfileBase):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    verification_status: str
    verification_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
