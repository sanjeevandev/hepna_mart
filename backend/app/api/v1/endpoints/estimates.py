import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import require_authenticated_user
from app.models.user import User
from app.schemas.estimate import (
    EstimateCreateRequest,
    EstimateUpdateRequest,
    EstimateResponse,
    EstimateListResponse,
    TransferToProjectRequest,
)
from app.services.estimate_service import EstimateService

logger = logging.getLogger("hepna.api.estimates")
router = APIRouter(prefix="/estimates", tags=["Customer Cost Estimates"])


@router.get("", response_model=EstimateListResponse)
def list_estimates(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Fetches all saved construction estimates for the authenticated user.
    """
    estimates = EstimateService.list_estimates(db, current_user.id)
    return EstimateListResponse(estimates=estimates, total=len(estimates))


@router.post("", response_model=EstimateResponse, status_code=status.HTTP_201_CREATED)
def create_estimate(
    payload: EstimateCreateRequest,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Saves a construction calculator estimate snapshot.
    """
    return EstimateService.create_estimate(db, current_user.id, payload)


@router.get("/{estimate_id}", response_model=EstimateResponse)
def get_estimate(
    estimate_id: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves an estimate with live comparison against current catalog prices.
    """
    return EstimateService.get_estimate(db, current_user.id, estimate_id)


@router.patch("/{estimate_id}", response_model=EstimateResponse)
def update_estimate(
    estimate_id: str,
    payload: EstimateUpdateRequest,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Updates notes or linked project for a saved estimate.
    """
    return EstimateService.update_estimate(db, current_user.id, estimate_id, payload)


@router.delete("/{estimate_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_estimate(
    estimate_id: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Deletes a saved estimate.
    """
    EstimateService.delete_estimate(db, current_user.id, estimate_id)
    return None


@router.post("/{estimate_id}/refresh-pricing", response_model=EstimateResponse)
def refresh_estimate_pricing(
    estimate_id: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Takes a new snapshot of current catalog prices for the estimate materials.
    """
    return EstimateService.refresh_pricing(db, current_user.id, estimate_id)


@router.post("/{estimate_id}/transfer", response_model=Dict[str, Any])
def transfer_estimate_to_project(
    estimate_id: str,
    payload: TransferToProjectRequest,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Transfers estimated materials into an existing project's BOQ.
    """
    return EstimateService.transfer_to_project_boq(
        db,
        current_user.id,
        estimate_id,
        payload.target_project_id,
    )
