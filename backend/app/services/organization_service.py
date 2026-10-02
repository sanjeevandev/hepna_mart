import logging
import secrets
import uuid
from datetime import datetime, timedelta, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy import select, or_, func, delete
from sqlalchemy.orm import Session, selectinload

from app.models.organization import (
    Organization,
    OrganizationMember,
    OrganizationInvitation,
    OrgRole,
)
from app.models.project import Project, ProjectMember
from app.models.user import User
from app.schemas.organization import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
    OrganizationMemberResponse,
    InvitationCreate,
    InvitationResponse,
)

logger = logging.getLogger("hepna.organization_service")


class OrganizationService:
    @staticmethod
    def _generate_slug(name: str) -> str:
        base = "".join(c if c.isalnum() else "-" for c in name.lower()).strip("-")
        return f"{base}-{uuid.uuid4().hex[:6]}"

    @staticmethod
    def _to_org_response(db: Session, org: Organization, current_user_id: Optional[str] = None) -> OrganizationResponse:
        member_count = db.scalar(
            select(func.count(OrganizationMember.id)).where(OrganizationMember.organization_id == org.id)
        ) or 0

        current_role = None
        if current_user_id:
            membership = db.scalar(
                select(OrganizationMember).where(
                    OrganizationMember.organization_id == org.id,
                    OrganizationMember.user_id == current_user_id,
                )
            )
            if membership:
                current_role = membership.role

        return OrganizationResponse(
            id=org.id,
            name=org.name,
            owner_id=org.owner_id,
            slug=org.slug,
            business_type=org.business_type,
            is_active=org.is_active,
            current_user_role=current_role,
            member_count=member_count,
            created_at=org.created_at,
            updated_at=org.updated_at,
        )

    @staticmethod
    def create_organization(db: Session, user_id: str, data: OrganizationCreate) -> OrganizationResponse:
        """
        Creates a new Organization and sets the creator as OrgRole.OWNER.
        """
        slug = data.slug.strip() if data.slug else OrganizationService._generate_slug(data.name)
        existing_slug = db.scalar(select(Organization).where(Organization.slug == slug))
        if existing_slug:
            slug = OrganizationService._generate_slug(data.name)

        org = Organization(
            id=f"org-{uuid.uuid4().hex[:12]}",
            name=data.name.strip(),
            owner_id=user_id,
            slug=slug,
            business_type=data.business_type.strip() if data.business_type else "Proprietorship",
            is_active=True,
        )
        db.add(org)
        db.flush()

        # Creator automatically receives OWNER role
        membership = OrganizationMember(
            id=str(uuid.uuid4()),
            organization_id=org.id,
            user_id=user_id,
            role=OrgRole.OWNER,
        )
        db.add(membership)
        db.commit()
        db.refresh(org)

        logger.info("Created organization %s for owner user %s", org.id, user_id)
        return OrganizationService._to_org_response(db, org, user_id)

    @staticmethod
    def list_user_organizations(db: Session, user_id: str) -> List[OrganizationResponse]:
        """
        Returns all organizations where user is an active member or owner.
        """
        stmt = (
            select(Organization)
            .join(OrganizationMember, OrganizationMember.organization_id == Organization.id)
            .where(OrganizationMember.user_id == user_id)
            .order_by(Organization.created_at.desc())
        )
        orgs = list(db.scalars(stmt).all())
        return [OrganizationService._to_org_response(db, o, user_id) for o in orgs]

    @staticmethod
    def get_organization(db: Session, org_id: str, user_id: str) -> OrganizationResponse:
        """
        Retrieves organization details if the user is a member.
        """
        org = db.scalar(select(Organization).where(Organization.id == org_id))
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization '{org_id}' not found.",
            )

        membership = db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id == user_id,
            )
        )
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You are not a member of this organization.",
            )

        return OrganizationService._to_org_response(db, org, user_id)

    @staticmethod
    def update_organization(db: Session, org_id: str, user_id: str, updates: OrganizationUpdate) -> OrganizationResponse:
        """
        Updates organization parameters. Only OWNER and ADMIN can update organization info.
        """
        org = db.scalar(select(Organization).where(Organization.id == org_id))
        if not org:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Organization '{org_id}' not found.",
            )

        membership = db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id == user_id,
            )
        )
        if not membership or membership.role not in [OrgRole.OWNER, OrgRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. Administrator or Owner role required to update organization details.",
            )

        if updates.name is not None and updates.name.strip():
            org.name = updates.name.strip()
        if updates.business_type is not None:
            org.business_type = updates.business_type.strip()
        if updates.is_active is not None:
            # Only owner can deactivate an organization
            if membership.role != OrgRole.OWNER:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Only the organization Owner can change organization active status.",
                )
            org.is_active = updates.is_active
        if updates.slug is not None and updates.slug.strip():
            slug_cand = updates.slug.strip()
            existing = db.scalar(
                select(Organization).where(Organization.slug == slug_cand, Organization.id != org.id)
            )
            if existing:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Organization slug '{slug_cand}' is already in use.",
                )
            org.slug = slug_cand

        org.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(org)
        return OrganizationService._to_org_response(db, org, user_id)

    @staticmethod
    def list_members(db: Session, org_id: str, user_id: str) -> List[OrganizationMemberResponse]:
        """
        Lists all members of the organization. Caller must be an active member.
        """
        # Check caller membership
        membership = db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id == user_id,
            )
        )
        if not membership:
            # Check if org exists
            org_exists = db.scalar(select(Organization.id).where(Organization.id == org_id))
            if not org_exists:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Organization '{org_id}' not found.",
                )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You are not a member of this organization.",
            )

        stmt = (
            select(OrganizationMember, User)
            .join(User, User.id == OrganizationMember.user_id)
            .where(OrganizationMember.organization_id == org_id)
            .order_by(OrganizationMember.created_at.asc())
        )
        rows = db.execute(stmt).all()

        results = []
        for member, u in rows:
            results.append(
                OrganizationMemberResponse(
                    id=member.id,
                    organization_id=member.organization_id,
                    user_id=member.user_id,
                    role=member.role,
                    email=u.email,
                    name=u.full_name or u.first_name,
                    created_at=member.created_at,
                    updated_at=member.updated_at,
                )
            )
        return results

    @staticmethod
    def update_member_role(
        db: Session,
        org_id: str,
        caller_id: str,
        target_user_id: str,
        new_role: OrgRole,
    ) -> OrganizationMemberResponse:
        """
        Updates a member's organizational role.
        Rules:
        - Caller cannot modify their own role.
        - Caller must be OWNER or ADMIN.
        - ADMIN cannot assign OWNER role.
        - ADMIN cannot modify an OWNER.
        - Target must be a member.
        - Cannot demote the sole OWNER.
        """
        if caller_id == target_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot modify your own organizational role.",
            )

        caller_mem = db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id == caller_id,
            )
        )
        if not caller_mem:
            org_exists = db.scalar(select(Organization.id).where(Organization.id == org_id))
            if not org_exists:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

        if caller_mem.role not in [OrgRole.OWNER, OrgRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Owner or Administrator privileges required to manage member roles.",
            )

        target_mem = db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id == target_user_id,
            )
        )
        if not target_mem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target member not found in this organization.",
            )

        # Admin restrictions
        if caller_mem.role == OrgRole.ADMIN:
            if target_mem.role == OrgRole.OWNER:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Administrators cannot modify the organization Owner's role.",
                )
            if new_role == OrgRole.OWNER:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Administrators cannot promote members to Owner.",
                )

        # Owner demotion protection
        if target_mem.role == OrgRole.OWNER and new_role != OrgRole.OWNER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The organization Owner cannot be demoted without ownership transfer.",
            )

        target_mem.role = new_role
        target_mem.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(target_mem)

        target_user = db.scalar(select(User).where(User.id == target_user_id))
        return OrganizationMemberResponse(
            id=target_mem.id,
            organization_id=target_mem.organization_id,
            user_id=target_mem.user_id,
            role=target_mem.role,
            email=target_user.email if target_user else None,
            name=target_user.full_name if target_user else None,
            created_at=target_mem.created_at,
            updated_at=target_mem.updated_at,
        )

    @staticmethod
    def remove_member(db: Session, org_id: str, caller_id: str, target_user_id: str) -> bool:
        """
        Removes a member from the organization or allows a member to leave.
        Rules:
        - OWNER cannot be removed.
        - Sole OWNER cannot leave.
        - ADMIN cannot remove OWNER.
        - VIEWERS/other non-admins cannot remove other members.
        """
        caller_mem = db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id == caller_id,
            )
        )
        if not caller_mem:
            org_exists = db.scalar(select(Organization.id).where(Organization.id == org_id))
            if not org_exists:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

        target_mem = db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id == target_user_id,
            )
        )
        if not target_mem:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target member not found in this organization.",
            )

        # Self leaving
        if caller_id == target_user_id:
            if target_mem.role == OrgRole.OWNER:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="The organization Owner cannot leave the organization without transferring ownership or deleting the organization.",
                )
            # Purge all project memberships in this organization's projects
            projects_subq = select(Project.id).where(Project.organization_id == org_id)
            db.execute(
                delete(ProjectMember).where(
                    ProjectMember.user_id == target_user_id,
                    ProjectMember.project_id.in_(projects_subq),
                )
            )
            db.delete(target_mem)
            db.commit()
            return True

        # Removing someone else
        if caller_mem.role not in [OrgRole.OWNER, OrgRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Owner or Administrator privileges required to remove members.",
            )

        if target_mem.role == OrgRole.OWNER:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="The organization Owner cannot be removed from the organization.",
            )

        if caller_mem.role == OrgRole.ADMIN and target_mem.role == OrgRole.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrators cannot remove other Administrators. Owner role required.",
            )

        # Purge all project memberships in this organization's projects
        projects_subq = select(Project.id).where(Project.organization_id == org_id)
        db.execute(
            delete(ProjectMember).where(
                ProjectMember.user_id == target_user_id,
                ProjectMember.project_id.in_(projects_subq),
            )
        )
        db.delete(target_mem)
        db.commit()
        return True

    @staticmethod
    def create_invitation(
        db: Session,
        org_id: str,
        caller_id: str,
        data: InvitationCreate,
    ) -> InvitationResponse:
        """
        Creates an invitation to join the organization.
        Rules:
        - Caller must be OWNER or ADMIN.
        - ADMIN cannot invite with OrgRole.OWNER.
        - Email must not already be an active member.
        - Cryptographic token generation: secrets.token_urlsafe(32).
        - Expiration: 7 days.
        """
        caller_mem = db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id == caller_id,
            )
        )
        if not caller_mem:
            org_exists = db.scalar(select(Organization.id).where(Organization.id == org_id))
            if not org_exists:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

        if caller_mem.role not in [OrgRole.OWNER, OrgRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Owner or Administrator privileges required to invite new members.",
            )

        if caller_mem.role == OrgRole.ADMIN and data.role == OrgRole.OWNER:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Administrators cannot invite members with the Owner role.",
            )

        target_email = data.email.strip().lower()

        # Check if user with this email is already a member
        existing_user = db.scalar(select(User).where(func.lower(User.email) == target_email))
        if existing_user:
            existing_mem = db.scalar(
                select(OrganizationMember).where(
                    OrganizationMember.organization_id == org_id,
                    OrganizationMember.user_id == existing_user.id,
                )
            )
            if existing_mem:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"User with email '{target_email}' is already an active member of this organization.",
                )

        # Check existing pending invitations for this email in this org
        existing_inv = db.scalar(
            select(OrganizationInvitation).where(
                OrganizationInvitation.organization_id == org_id,
                func.lower(OrganizationInvitation.email) == target_email,
                OrganizationInvitation.status == "pending",
            )
        )
        if existing_inv:
            if not existing_inv.is_expired:
                # Update role and extend expiry
                existing_inv.role = data.role
                existing_inv.expires_at = datetime.now(timezone.utc) + timedelta(days=7)
                existing_inv.updated_at = datetime.now(timezone.utc)
                db.commit()
                db.refresh(existing_inv)
                return InvitationResponse.model_validate(existing_inv)
            else:
                existing_inv.status = "expired"

        # Generate cryptographic token
        secure_token = secrets.token_urlsafe(32)
        invitation = OrganizationInvitation(
            id=str(uuid.uuid4()),
            organization_id=org_id,
            invited_by_user_id=caller_id,
            email=target_email,
            role=data.role,
            token=secure_token,
            status="pending",
            expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        )
        db.add(invitation)
        db.commit()
        db.refresh(invitation)

        logger.info("Created invitation %s for email %s in org %s", invitation.id, target_email, org_id)
        return InvitationResponse.model_validate(invitation)

    @staticmethod
    def list_invitations(db: Session, org_id: str, user_id: str) -> List[InvitationResponse]:
        """
        Lists all invitations for the organization. Caller must be OWNER or ADMIN.
        """
        caller_mem = db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id == user_id,
            )
        )
        if not caller_mem:
            org_exists = db.scalar(select(Organization.id).where(Organization.id == org_id))
            if not org_exists:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

        if caller_mem.role not in [OrgRole.OWNER, OrgRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Owner or Administrator privileges required to view invitations.",
            )

        stmt = (
            select(OrganizationInvitation)
            .where(OrganizationInvitation.organization_id == org_id)
            .order_by(OrganizationInvitation.created_at.desc())
        )
        invitations = list(db.scalars(stmt).all())

        now = datetime.now(timezone.utc)
        now_naive = now.replace(tzinfo=None)
        results = []
        for inv in invitations:
            is_exp = (now_naive > inv.expires_at) if inv.expires_at.tzinfo is None else (now > inv.expires_at)
            if inv.status == "pending" and is_exp:
                inv.status = "expired"
                inv.updated_at = now
            results.append(InvitationResponse.model_validate(inv))
        db.commit()
        return results

    @staticmethod
    def revoke_invitation(db: Session, org_id: str, caller_id: str, invitation_id: str) -> bool:
        """
        Revokes a pending invitation. Caller must be OWNER or ADMIN.
        """
        caller_mem = db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == org_id,
                OrganizationMember.user_id == caller_id,
            )
        )
        if not caller_mem:
            org_exists = db.scalar(select(Organization.id).where(Organization.id == org_id))
            if not org_exists:
                raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Organization not found.")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

        if caller_mem.role not in [OrgRole.OWNER, OrgRole.ADMIN]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Owner or Administrator privileges required to revoke invitations.",
            )

        inv = db.scalar(
            select(OrganizationInvitation).where(
                OrganizationInvitation.id == invitation_id,
                OrganizationInvitation.organization_id == org_id,
            )
        )
        if not inv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invitation not found.",
            )

        if inv.status == "accepted":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot revoke an already accepted invitation.",
            )

        inv.status = "revoked"
        inv.updated_at = datetime.now(timezone.utc)
        db.commit()
        return True

    @staticmethod
    def accept_invitation(db: Session, current_user: User, token: str) -> Dict[str, Any]:
        """
        Accepts an invitation.
        Security invariants:
        - Token must exist.
        - Status must be 'pending'.
        - Must not be expired.
        - Recipient email must match current_user.email (case-insensitive).
        - Replay is blocked (status transitions to 'accepted').
        """
        inv = db.scalar(select(OrganizationInvitation).where(OrganizationInvitation.token == token))
        if not inv:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Invalid invitation token.",
            )

        if inv.status == "revoked":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invitation has been revoked.",
            )

        if inv.status == "accepted":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invitation has already been accepted.",
            )

        now = datetime.now(timezone.utc)
        now_naive = now.replace(tzinfo=None)
        is_exp = (now_naive > inv.expires_at) if inv.expires_at.tzinfo is None else (now > inv.expires_at)
        if is_exp or inv.status == "expired":
            inv.status = "expired"
            db.commit()
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This invitation has expired.",
            )

        # Email binding verification
        if inv.email.strip().lower() != current_user.email.strip().lower():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"This invitation was sent to a different email address ('{inv.email}'). You are currently signed in as '{current_user.email}'. Please sign in with the invited email address.",
            )

        # Check existing membership
        existing_mem = db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == inv.organization_id,
                OrganizationMember.user_id == current_user.id,
            )
        )
        if not existing_mem:
            new_mem = OrganizationMember(
                id=str(uuid.uuid4()),
                organization_id=inv.organization_id,
                user_id=current_user.id,
                role=inv.role,
            )
            db.add(new_mem)

        inv.status = "accepted"
        inv.updated_at = now
        db.commit()

        org = db.scalar(select(Organization).where(Organization.id == inv.organization_id))

        return {
            "status": "ok",
            "message": f"Successfully joined {org.name if org else 'organization'} as {inv.role.value}.",
            "organization_id": inv.organization_id,
            "organization_name": org.name if org else "Organization",
            "role": inv.role,
        }
