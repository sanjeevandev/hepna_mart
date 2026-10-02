import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import (
    require_authenticated_user,
    get_current_active_user,
)
from app.models.user import User
from app.models.organization import OrgRole
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
    OrganizationMemberResponse,
    OrganizationMemberUpdateRole,
    InvitationCreate,
    InvitationResponse,
    InvitationAcceptRequest,
)
from app.services.organization_service import OrganizationService

logger = logging.getLogger("hepna.organizations_api")

router = APIRouter(prefix="/organizations", tags=["Customer Organizations & Teams"])
invitations_router = APIRouter(prefix="/invitations", tags=["Organization Invitations"])


# --- Organization Management ---

@router.get("", response_model=List[OrganizationResponse])
def list_my_organizations(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Lists all organizations where the authenticated customer is an active member or owner.
    """
    return OrganizationService.list_user_organizations(db, current_user.id)


@router.post("", response_model=OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    payload: OrganizationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Creates a new Customer Organization. The creator automatically receives the OWNER role.
    """
    return OrganizationService.create_organization(db, current_user.id, payload)


@router.get("/{org_id}", response_model=OrganizationResponse)
def get_organization(
    org_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves organization details. Enforces member-only access and IDOR isolation.
    """
    return OrganizationService.get_organization(db, org_id, current_user.id)


@router.put("/{org_id}", response_model=OrganizationResponse)
def update_organization(
    org_id: str,
    payload: OrganizationUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Updates organization properties. Requires OWNER or ADMIN role in the organization.
    """
    return OrganizationService.update_organization(db, org_id, current_user.id, payload)


# --- Member Management ---

@router.get("/{org_id}/members", response_model=List[OrganizationMemberResponse])
def list_organization_members(
    org_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Lists all members belonging to the organization.
    """
    return OrganizationService.list_members(db, org_id, current_user.id)


@router.put("/{org_id}/members/{user_id}", response_model=OrganizationMemberResponse)
def update_organization_member_role(
    org_id: str,
    user_id: str,
    payload: OrganizationMemberUpdateRole,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Updates a member's organizational role.
    Requires OWNER or ADMIN role. Prevents privilege escalation and owner demotion.
    """
    return OrganizationService.update_member_role(db, org_id, current_user.id, user_id, payload.role)


@router.delete("/{org_id}/members/{user_id}")
def remove_organization_member(
    org_id: str,
    user_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Removes a member from the organization, or allows a member to leave.
    Owner cannot be removed.
    """
    success = OrganizationService.remove_member(db, org_id, current_user.id, user_id)
    return {"status": "ok", "detail": "Member successfully removed from organization."}


# --- Invitations ---

@router.post("/{org_id}/invitations", response_model=InvitationResponse, status_code=status.HTTP_201_CREATED)
def create_organization_invitation(
    org_id: str,
    payload: InvitationCreate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Sends an invitation to a user by email to join the organization with a specified role.
    Requires OWNER or ADMIN role.
    """
    return OrganizationService.create_invitation(db, org_id, current_user.id, payload)


@router.get("/{org_id}/invitations", response_model=List[InvitationResponse])
def list_organization_invitations(
    org_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Lists all invitations for the organization. Requires OWNER or ADMIN role.
    """
    return OrganizationService.list_invitations(db, org_id, current_user.id)


@router.delete("/{org_id}/invitations/{invitation_id}")
def revoke_organization_invitation(
    org_id: str,
    invitation_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Revokes a pending invitation. Requires OWNER or ADMIN role.
    """
    OrganizationService.revoke_invitation(db, org_id, current_user.id, invitation_id)
    return {"status": "ok", "detail": "Invitation revoked successfully."}


# --- Accept Invitation (Global endpoint) ---

@invitations_router.post("/{token}/accept")
def accept_organization_invitation(
    token: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """
    Accepts an organization invitation.
    Verifies cryptographic token validity, non-expired status, email binding, and prevents replay.
    """
    return OrganizationService.accept_invitation(db, current_user, token)
