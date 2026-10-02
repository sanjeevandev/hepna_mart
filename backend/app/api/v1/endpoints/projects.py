import logging
from typing import List, Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import require_authenticated_user
from app.models.user import User
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectListResponse,
    ProjectMaterialCreate,
    ProjectMaterialUpdate,
    ProjectMemberResponse,
    ProjectMemberAddRequest,
    ProjectMemberUpdateRequest,
    ProjectTransferRequest,
)
from app.schemas.activity import ProjectActivityListResponse
from app.services.project_service import ProjectService
from app.services.activity_service import ProjectActivityService

logger = logging.getLogger("hepna.api.projects")
router = APIRouter(prefix="/projects", tags=["Customer Projects & BOQ Workspace"])


@router.get("", response_model=ProjectListResponse)
def list_projects(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Fetches all construction projects accessible to the authenticated customer
    (personal projects + shared organization projects).
    """
    projects = ProjectService.list_projects(db, current_user.id)
    return ProjectListResponse(projects=projects, total=len(projects))


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    payload: ProjectCreate,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Creates a new construction project workspace (personal or organization-bound).
    """
    return ProjectService.create_project(db, current_user.id, payload)


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves project details and full itemized BOQ. Enforces RBAC / personal ownership.
    """
    return ProjectService.get_project(db, current_user.id, project_id)


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: str,
    payload: ProjectUpdate,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Updates project metadata, specifications, or completed stages.
    """
    return ProjectService.update_project(db, current_user.id, project_id, payload)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Permanently deletes a project and cascades deletion to all BOQ materials.
    For organization projects, only Org Owner/Admin can delete.
    """
    ProjectService.delete_project(db, current_user.id, project_id)
    return None


@router.post("/{project_id}/transfer-organization", response_model=ProjectResponse)
def transfer_project_organization(
    project_id: str,
    payload: ProjectTransferRequest,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Transfers project to another organization or converts to personal project.
    """
    return ProjectService.transfer_organization(db, current_user.id, project_id, payload)


# =============================================================================
# PROJECT ACTIVITY & AUDIT HISTORY (Phase 2L.4)
# =============================================================================

@router.get("/{project_id}/activity", response_model=ProjectActivityListResponse)
def get_project_activity(
    project_id: str,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=100),
    action: Optional[str] = Query(None),
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves chronological activity and audit history logs for the project.
    Enforces authorization and personal workspace isolation.
    """
    return ProjectActivityService.list_project_activities(
        db=db,
        user_id=current_user.id,
        project_id=project_id,
        page=page,
        limit=limit,
        action=action,
    )


# =============================================================================
# PROJECT COLLABORATORS / MEMBERS
# =============================================================================

@router.get("/{project_id}/members", response_model=List[ProjectMemberResponse])
def list_project_members(
    project_id: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Lists all collaborators assigned to the project.
    """
    return ProjectService.list_members(db, current_user.id, project_id)


@router.post("/{project_id}/members", response_model=ProjectMemberResponse, status_code=status.HTTP_201_CREATED)
def add_project_member(
    project_id: str,
    payload: ProjectMemberAddRequest,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Assigns an organization member to the project.
    """
    return ProjectService.add_member(db, current_user.id, project_id, payload)


@router.patch("/{project_id}/members/{user_id}", response_model=ProjectMemberResponse)
def update_project_member_role(
    project_id: str,
    user_id: str,
    payload: ProjectMemberUpdateRequest,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Updates the role of a project collaborator.
    """
    return ProjectService.update_member_role(db, current_user.id, project_id, user_id, payload)


@router.delete("/{project_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_project_member(
    project_id: str,
    user_id: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Removes a collaborator from the project or leaves the project.
    """
    ProjectService.remove_member(db, current_user.id, project_id, user_id)
    return None


# =============================================================================
# BOQ MATERIALS
# =============================================================================

@router.post("/{project_id}/materials", response_model=ProjectResponse)
def add_material_to_project(
    project_id: str,
    payload: ProjectMaterialCreate,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Adds a catalog product to the project BOQ.
    """
    return ProjectService.add_material(db, current_user.id, project_id, payload)


@router.patch("/{project_id}/materials/{product_id}", response_model=ProjectResponse)
def update_project_material(
    project_id: str,
    product_id: str,
    payload: ProjectMaterialUpdate,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Updates material quantity, purchased status, wastage, or notes in the BOQ.
    """
    return ProjectService.update_material(db, current_user.id, project_id, product_id, payload)


@router.delete("/{project_id}/materials/{product_id}", response_model=ProjectResponse)
def remove_material_from_project(
    project_id: str,
    product_id: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Removes a material item from the project BOQ.
    """
    return ProjectService.remove_material(db, current_user.id, project_id, product_id)


@router.post("/{project_id}/refresh-pricing", response_model=ProjectResponse)
def refresh_project_boq_pricing(
    project_id: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Updates all BOQ material price snapshots to current catalog rates.
    """
    return ProjectService.refresh_boq_pricing(db, current_user.id, project_id)


@router.post("/{project_id}/stages/{stage}/toggle", response_model=ProjectResponse)
def toggle_project_stage(
    project_id: str,
    stage: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Toggles completion status for a construction milestone stage.
    """
    return ProjectService.toggle_stage_complete(db, current_user.id, project_id, stage)
