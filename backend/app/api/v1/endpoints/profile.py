import logging
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import require_authenticated_user
from app.models.user import User
from app.schemas.profile import (
    BusinessProfileCreate,
    BusinessProfileUpdate,
    BusinessProfileResponse,
    ContractorProfileCreate,
    ContractorProfileUpdate,
    ContractorProfileResponse,
)
from app.services.profile_service import ProfileService

logger = logging.getLogger("hepna.api.profile")
router = APIRouter(prefix="/profile", tags=["Customer Business & Contractor Profiles"])


@router.get("/business", response_model=BusinessProfileResponse)
def get_business_profile(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves the corporate / tax profile for the authenticated customer.
    """
    return ProfileService.get_business_profile(db, current_user.id)


@router.put("/business", response_model=BusinessProfileResponse)
def update_business_profile(
    payload: BusinessProfileCreate,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Creates or updates the corporate / tax profile for the authenticated customer (upsert).
    """
    return ProfileService.upsert_business_profile(db, current_user.id, payload)


@router.get("/contractor", response_model=ContractorProfileResponse)
def get_contractor_profile(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves the contractor specialization and trade profile for the authenticated customer.
    """
    return ProfileService.get_contractor_profile(db, current_user.id)


@router.put("/contractor", response_model=ContractorProfileResponse)
def update_contractor_profile(
    payload: ContractorProfileCreate,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Creates or updates the contractor specialization profile for the authenticated customer (upsert).
    """
    return ProfileService.upsert_contractor_profile(db, current_user.id, payload)
