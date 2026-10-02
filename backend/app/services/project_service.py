import logging
import uuid
from decimal import Decimal
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy import select, or_, delete, func
from sqlalchemy.orm import Session, selectinload

from app.models.project import Project, ProjectMaterial, ProjectMember
from app.models.product import Product
from app.models.organization import Organization, OrganizationMember, OrgRole
from app.models.user import User
from app.models.activity import ProjectAction
from app.services.activity_service import ProjectActivityService
from app.schemas.project import (
    ProjectCreate,
    ProjectUpdate,
    ProjectResponse,
    ProjectMaterialCreate,
    ProjectMaterialUpdate,
    ProjectMaterialResponse,
    ProjectMemberResponse,
    ProjectMemberAddRequest,
    ProjectMemberUpdateRequest,
    ProjectTransferRequest,
)

logger = logging.getLogger("hepna.project_service")

ROLE_RANK: Dict[OrgRole, int] = {
    OrgRole.VIEWER: 1,
    OrgRole.SITE_SUPERVISOR: 2,
    OrgRole.PROCUREMENT_MANAGER: 3,
    OrgRole.PROJECT_MANAGER: 4,
    OrgRole.ADMIN: 5,
    OrgRole.OWNER: 6,
}


class ProjectService:
    @staticmethod
    def _resolve_effective_role(db: Session, project: Project, user_id: str) -> Optional[OrgRole]:
        """
        Determines the effective role of a user for a given project.
        - Personal projects: Creator/Owner has OrgRole.OWNER; all others None.
        - Organization projects:
            - Org OWNER/ADMIN have immediate OrgRole.OWNER / OrgRole.ADMIN.
            - Other members must have an active ProjectMember record.
            - Effective role is capped: min(org_member.role, project_member.role).
        """
        if not project.organization_id:
            return OrgRole.OWNER if project.user_id == user_id else None

        # Fetch org membership
        org_member = db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == project.organization_id,
                OrganizationMember.user_id == user_id,
            )
        )
        if not org_member:
            return None

        # Org Owner / Admin have full override
        if org_member.role in [OrgRole.OWNER, OrgRole.ADMIN]:
            return org_member.role

        # Check project membership
        proj_member = db.scalar(
            select(ProjectMember).where(
                ProjectMember.project_id == project.id,
                ProjectMember.user_id == user_id,
            )
        )
        if not proj_member:
            return None

        # Effective role capped by org role rank
        if ROLE_RANK.get(proj_member.role, 0) <= ROLE_RANK.get(org_member.role, 0):
            return proj_member.role
        return org_member.role

    @staticmethod
    def _to_project_response(db: Session, project: Project, current_user_id: Optional[str] = None) -> ProjectResponse:
        """
        Transforms a Project ORM entity into a rich ProjectResponse schema with
        organization name, effective role, member list, and materials.
        """
        current_user_role = None
        if current_user_id:
            current_user_role = ProjectService._resolve_effective_role(db, project, current_user_id)

        org_name = None
        if project.organization_id:
            org = db.scalar(select(Organization.name).where(Organization.id == project.organization_id))
            org_name = org

        # Load project members with user details
        members_resp: List[ProjectMemberResponse] = []
        if project.organization_id:
            stmt = (
                select(ProjectMember, User)
                .join(User, User.id == ProjectMember.user_id)
                .where(ProjectMember.project_id == project.id)
                .order_by(ProjectMember.created_at.asc())
            )
            for pm, u in db.execute(stmt).all():
                members_resp.append(
                    ProjectMemberResponse(
                        id=pm.id,
                        project_id=pm.project_id,
                        user_id=pm.user_id,
                        role=pm.role,
                        email=u.email,
                        name=u.full_name or u.first_name,
                        created_at=pm.created_at,
                        updated_at=pm.updated_at,
                    )
                )

        materials_resp = [
            ProjectMaterialResponse(
                id=m.id,
                project_id=m.project_id,
                product_id=m.product_id,
                quantity=m.quantity,
                unit=m.unit,
                purchased_quantity=m.purchased_quantity,
                wastage_percent=m.wastage_percent,
                stage=m.stage,
                price_at_addition=m.price_at_addition,
                notes=m.notes,
                added_at=m.added_at,
                created_at=m.created_at or m.added_at,
                updated_at=m.updated_at,
            )
            for m in (project.materials or [])
        ]

        return ProjectResponse(
            id=project.id,
            user_id=project.user_id,
            organization_id=project.organization_id,
            organization_name=org_name,
            current_user_role=current_user_role,
            member_count=len(members_resp),
            is_shared=bool(project.organization_id),
            name=project.name,
            project_type=project.project_type,
            built_up_area=project.built_up_area,
            area_unit=project.area_unit,
            floors=project.floors,
            stage=project.stage,
            city=project.city,
            pincode=project.pincode,
            completed_stages=project.completed_stages or [],
            members=members_resp,
            materials=materials_resp,
            created_at=project.created_at,
            updated_at=project.updated_at,
        )

    @staticmethod
    def list_projects(db: Session, user_id: str) -> List[ProjectResponse]:
        """
        Fetches all projects accessible to the user:
        1. Personal projects owned by the user (organization_id is NULL and user_id == user_id)
        2. Organization projects where the user is Org OWNER or ADMIN
        3. Organization projects where the user is an explicit ProjectMember
        """
        admin_org_subq = (
            select(OrganizationMember.organization_id)
            .where(
                OrganizationMember.user_id == user_id,
                OrganizationMember.role.in_([OrgRole.OWNER, OrgRole.ADMIN]),
            )
        )

        assigned_proj_subq = (
            select(ProjectMember.project_id)
            .where(ProjectMember.user_id == user_id)
        )

        user_orgs_subq = (
            select(OrganizationMember.organization_id)
            .where(OrganizationMember.user_id == user_id)
        )

        stmt = (
            select(Project)
            .options(
                selectinload(Project.materials),
                selectinload(Project.members),
            )
            .where(
                or_(
                    (Project.user_id == user_id) & (Project.organization_id.is_(None)),
                    (Project.organization_id.is_not(None)) & (Project.organization_id.in_(admin_org_subq)),
                    (Project.organization_id.is_not(None))
                    & (Project.organization_id.in_(user_orgs_subq))
                    & (Project.id.in_(assigned_proj_subq)),
                )
            )
            .order_by(Project.updated_at.desc())
        )

        projects = list(db.scalars(stmt).all())
        return [ProjectService._to_project_response(db, p, user_id) for p in projects]

    @staticmethod
    def get_project_entity(
        db: Session,
        user_id: str,
        project_id: str,
        required_roles: Optional[List[OrgRole]] = None,
    ) -> Project:
        """
        Retrieves a Project ORM entity and enforces effective role authorization.
        """
        stmt = (
            select(Project)
            .where(Project.id == project_id)
            .options(
                selectinload(Project.materials),
                selectinload(Project.members),
            )
        )
        project = db.scalar(stmt)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project '{project_id}' not found.",
            )

        effective_role = ProjectService._resolve_effective_role(db, project, user_id)
        if not effective_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You do not have permission to access this project.",
            )

        if required_roles and effective_role not in required_roles:
            role_names = [r.value for r in required_roles]
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required role: one of {role_names} (current effective role: {effective_role.value}).",
            )

        return project

    @staticmethod
    def get_project(db: Session, user_id: str, project_id: str) -> ProjectResponse:
        """
        Retrieves project details and full itemized BOQ for the authenticated user.
        """
        project = ProjectService.get_project_entity(db, user_id, project_id)
        return ProjectService._to_project_response(db, project, user_id)

    @staticmethod
    def create_project(db: Session, user_id: str, data: ProjectCreate) -> ProjectResponse:
        """
        Creates a new project (personal or bound to an organization).
        If bound to an organization, caller must be an active member with role >= PROJECT_MANAGER.
        """
        org_id = data.organization_id
        if org_id:
            org_member = db.scalar(
                select(OrganizationMember).where(
                    OrganizationMember.organization_id == org_id,
                    OrganizationMember.user_id == user_id,
                )
            )
            if not org_member:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. You are not a member of the specified organization.",
                )

            if org_member.role in [OrgRole.SITE_SUPERVISOR, OrgRole.VIEWER, OrgRole.PROCUREMENT_MANAGER]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions. Only Project Managers, Administrators, or Owners can create organization projects.",
                )

        project = Project(
            id=f"proj-{uuid.uuid4().hex[:12]}",
            user_id=user_id,
            organization_id=org_id,
            name=data.name.strip(),
            project_type=data.project_type,
            built_up_area=data.built_up_area,
            area_unit=data.area_unit,
            floors=data.floors,
            stage=data.stage,
            city=data.city.strip(),
            pincode=data.pincode.strip(),
            completed_stages=[],
        )
        db.add(project)
        db.flush()

        # If organization project, add creator as ProjectMember
        if org_id:
            pm_role = OrgRole.PROJECT_MANAGER
            org_member = db.scalar(
                select(OrganizationMember).where(
                    OrganizationMember.organization_id == org_id,
                    OrganizationMember.user_id == user_id,
                )
            )
            if org_member and org_member.role in [OrgRole.OWNER, OrgRole.ADMIN]:
                pm_role = org_member.role

            proj_member = ProjectMember(
                id=str(uuid.uuid4()),
                project_id=project.id,
                user_id=user_id,
                role=pm_role,
            )
            db.add(proj_member)

        # Audit Activity Log
        ProjectActivityService.log_activity(
            db=db,
            action=ProjectAction.PROJECT_CREATED,
            resource_type="project",
            resource_id=project.id,
            project_id=project.id,
            organization_id=project.organization_id,
            actor_user_id=user_id,
            metadata={
                "name": project.name,
                "project_type": project.project_type,
                "built_up_area": float(project.built_up_area),
                "city": project.city,
                "is_shared": bool(project.organization_id),
            },
        )

        db.commit()
        db.refresh(project)
        logger.info("Created project %s for user %s (org: %s)", project.id, user_id, org_id)
        return ProjectService._to_project_response(db, project, user_id)

    @staticmethod
    def update_project(db: Session, user_id: str, project_id: str, updates: ProjectUpdate) -> ProjectResponse:
        """
        Updates project metadata. Requires PROJECT_MANAGER, ADMIN, or OWNER role.
        """
        project = ProjectService.get_project_entity(
            db,
            user_id,
            project_id,
            required_roles=[OrgRole.PROJECT_MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
        )

        update_dict = updates.model_dump(exclude_unset=True)
        old_data = {}
        for key, val in update_dict.items():
            if val is not None:
                old_data[key] = getattr(project, key, None)
                setattr(project, key, val)

        project.updated_at = datetime.now(timezone.utc)

        # Audit Activity Log
        if update_dict:
            clean_changes = {}
            for k, v in update_dict.items():
                clean_changes[k] = float(v) if isinstance(v, Decimal) else v

            ProjectActivityService.log_activity(
                db=db,
                action=ProjectAction.PROJECT_UPDATED,
                resource_type="project",
                resource_id=project.id,
                project_id=project.id,
                organization_id=project.organization_id,
                actor_user_id=user_id,
                metadata={
                    "updated_fields": list(update_dict.keys()),
                    "changes": clean_changes,
                },
            )

        db.commit()
        db.refresh(project)
        return ProjectService._to_project_response(db, project, user_id)

    @staticmethod
    def delete_project(db: Session, user_id: str, project_id: str) -> bool:
        """
        Deletes a project and all associated materials/members.
        - Personal project: owner only.
        - Organization project: Org OWNER or ADMIN only. (Project Managers cannot delete org projects).
        """
        stmt = select(Project).where(Project.id == project_id)
        project = db.scalar(stmt)
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project '{project_id}' not found.",
            )

        if not project.organization_id:
            if project.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. You do not own this personal project.",
                )
        else:
            org_member = db.scalar(
                select(OrganizationMember).where(
                    OrganizationMember.organization_id == project.organization_id,
                    OrganizationMember.user_id == user_id,
                )
            )
            if not org_member or org_member.role not in [OrgRole.OWNER, OrgRole.ADMIN]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. Only organization Owners or Administrators can delete organization projects.",
                )

        # Audit Activity Log
        ProjectActivityService.log_activity(
            db=db,
            action=ProjectAction.PROJECT_DELETED,
            resource_type="project",
            resource_id=project.id,
            project_id=project.id,
            organization_id=project.organization_id,
            actor_user_id=user_id,
            metadata={
                "name": project.name,
                "city": project.city,
            },
        )

        db.delete(project)
        db.commit()
        logger.info("Deleted project %s by user %s", project_id, user_id)
        return True

    @staticmethod
    def transfer_organization(
        db: Session,
        user_id: str,
        project_id: str,
        req: ProjectTransferRequest,
    ) -> ProjectResponse:
        """
        Transfers a project to a new organization or makes it a personal project.
        - Caller must be Org OWNER/ADMIN (for org project) or owner (for personal project).
        - If moving to target organization: caller must also be Org OWNER/ADMIN in destination.
        - Non-member ProjectMembers are purged during transfer.
        """
        project = db.scalar(
            select(Project)
            .where(Project.id == project_id)
            .options(selectinload(Project.materials), selectinload(Project.members))
        )
        if not project:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Project '{project_id}' not found.",
            )

        previous_org_id = project.organization_id

        # Source permission check
        if not project.organization_id:
            if project.user_id != user_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. You do not own this personal project.",
                )
        else:
            source_org_mem = db.scalar(
                select(OrganizationMember).where(
                    OrganizationMember.organization_id == project.organization_id,
                    OrganizationMember.user_id == user_id,
                )
            )
            if not source_org_mem or source_org_mem.role not in [OrgRole.OWNER, OrgRole.ADMIN]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. Only organization Owners or Admins can transfer projects out.",
                )

        target_org_id = req.target_organization_id
        if target_org_id:
            dest_org = db.scalar(select(Organization).where(Organization.id == target_org_id))
            if not dest_org:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"Target organization '{target_org_id}' not found.",
                )

            dest_org_mem = db.scalar(
                select(OrganizationMember).where(
                    OrganizationMember.organization_id == target_org_id,
                    OrganizationMember.user_id == user_id,
                )
            )
            if not dest_org_mem or dest_org_mem.role not in [OrgRole.OWNER, OrgRole.ADMIN]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Access denied. You must be an Owner or Admin of the target organization.",
                )

            project.organization_id = target_org_id

            dest_user_ids = set(
                db.scalars(
                    select(OrganizationMember.user_id).where(OrganizationMember.organization_id == target_org_id)
                ).all()
            )

            for member in list(project.members):
                if member.user_id not in dest_user_ids:
                    db.delete(member)

            caller_pm = next((m for m in project.members if m.user_id == user_id), None)
            if not caller_pm:
                new_pm = ProjectMember(
                    id=str(uuid.uuid4()),
                    project_id=project.id,
                    user_id=user_id,
                    role=dest_org_mem.role,
                )
                db.add(new_pm)
        else:
            project.organization_id = None
            project.user_id = user_id
            for member in list(project.members):
                db.delete(member)

        project.updated_at = datetime.now(timezone.utc)

        # Audit Activity Log
        action_type = ProjectAction.PROJECT_MOVED_TO_ORGANIZATION if target_org_id else ProjectAction.PROJECT_MOVED_TO_PERSONAL
        ProjectActivityService.log_activity(
            db=db,
            action=action_type,
            resource_type="project",
            resource_id=project.id,
            project_id=project.id,
            organization_id=project.organization_id,
            actor_user_id=user_id,
            metadata={
                "previous_organization_id": previous_org_id,
                "target_organization_id": target_org_id,
            },
        )

        db.commit()
        db.refresh(project)
        logger.info("Transferred project %s to org %s by user %s", project.id, target_org_id, user_id)
        return ProjectService._to_project_response(db, project, user_id)

    @staticmethod
    def list_members(db: Session, user_id: str, project_id: str) -> List[ProjectMemberResponse]:
        """
        Lists all members assigned to a project. Caller must have access to the project.
        """
        project = ProjectService.get_project_entity(db, user_id, project_id)
        if not project.organization_id:
            return []

        stmt = (
            select(ProjectMember, User)
            .join(User, User.id == ProjectMember.user_id)
            .where(ProjectMember.project_id == project.id)
            .order_by(ProjectMember.created_at.asc())
        )
        results = []
        for pm, u in db.execute(stmt).all():
            results.append(
                ProjectMemberResponse(
                    id=pm.id,
                    project_id=pm.project_id,
                    user_id=pm.user_id,
                    role=pm.role,
                    email=u.email,
                    name=u.full_name or u.first_name,
                    created_at=pm.created_at,
                    updated_at=pm.updated_at,
                )
            )
        return results

    @staticmethod
    def add_member(
        db: Session,
        user_id: str,
        project_id: str,
        data: ProjectMemberAddRequest,
    ) -> ProjectMemberResponse:
        """
        Assigns an organization member to a project with a specific project role.
        """
        project = ProjectService.get_project_entity(
            db,
            user_id,
            project_id,
            required_roles=[OrgRole.PROJECT_MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
        )
        if not project.organization_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot add collaborators to a personal project. Transfer the project to an organization first.",
            )

        caller_effective = ProjectService._resolve_effective_role(db, project, user_id)
        if caller_effective == OrgRole.PROJECT_MANAGER and data.role in [OrgRole.ADMIN, OrgRole.OWNER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Project Managers cannot assign Administrator or Owner roles.",
            )

        target_org_mem = db.scalar(
            select(OrganizationMember).where(
                OrganizationMember.organization_id == project.organization_id,
                OrganizationMember.user_id == data.user_id,
            )
        )
        if not target_org_mem:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Target user is not a member of the organization.",
            )

        existing_pm = db.scalar(
            select(ProjectMember).where(
                ProjectMember.project_id == project.id,
                ProjectMember.user_id == data.user_id,
            )
        )
        if existing_pm:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User is already assigned to this project.",
            )

        pm = ProjectMember(
            id=str(uuid.uuid4()),
            project_id=project.id,
            user_id=data.user_id,
            role=data.role,
        )
        db.add(pm)

        target_user = db.scalar(select(User).where(User.id == data.user_id))

        # Audit Activity Log
        ProjectActivityService.log_activity(
            db=db,
            action=ProjectAction.PROJECT_MEMBER_ADDED,
            resource_type="project_member",
            resource_id=pm.id,
            project_id=project.id,
            organization_id=project.organization_id,
            actor_user_id=user_id,
            metadata={
                "member_user_id": data.user_id,
                "member_name": (target_user.full_name or target_user.first_name) if target_user else None,
                "member_email": target_user.email if target_user else None,
                "role": data.role.value if hasattr(data.role, "value") else str(data.role),
            },
        )

        db.commit()
        db.refresh(pm)

        return ProjectMemberResponse(
            id=pm.id,
            project_id=pm.project_id,
            user_id=pm.user_id,
            role=pm.role,
            email=target_user.email if target_user else None,
            name=target_user.full_name if target_user else None,
            created_at=pm.created_at,
            updated_at=pm.updated_at,
        )

    @staticmethod
    def update_member_role(
        db: Session,
        user_id: str,
        project_id: str,
        target_user_id: str,
        data: ProjectMemberUpdateRequest,
    ) -> ProjectMemberResponse:
        """
        Updates a collaborator's role within the project.
        """
        project = ProjectService.get_project_entity(
            db,
            user_id,
            project_id,
            required_roles=[OrgRole.PROJECT_MANAGER, OrgRole.ADMIN, OrgRole.OWNER],
        )
        if not project.organization_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Personal projects do not support collaborators.",
            )

        target_pm = db.scalar(
            select(ProjectMember).where(
                ProjectMember.project_id == project.id,
                ProjectMember.user_id == target_user_id,
            )
        )
        if not target_pm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project member not found.",
            )

        caller_effective = ProjectService._resolve_effective_role(db, project, user_id)
        if caller_effective == OrgRole.PROJECT_MANAGER:
            if target_pm.role in [OrgRole.ADMIN, OrgRole.OWNER]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Project Managers cannot modify roles of Administrators or Owners.",
                )
            if data.role in [OrgRole.ADMIN, OrgRole.OWNER]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Project Managers cannot assign Administrator or Owner roles.",
                )

        old_role = target_pm.role
        target_pm.role = data.role
        target_pm.updated_at = datetime.now(timezone.utc)

        target_user = db.scalar(select(User).where(User.id == target_user_id))

        # Audit Activity Log
        ProjectActivityService.log_activity(
            db=db,
            action=ProjectAction.PROJECT_MEMBER_ROLE_UPDATED,
            resource_type="project_member",
            resource_id=target_pm.id,
            project_id=project.id,
            organization_id=project.organization_id,
            actor_user_id=user_id,
            metadata={
                "member_user_id": target_user_id,
                "member_name": (target_user.full_name or target_user.first_name) if target_user else None,
                "old_role": old_role.value if hasattr(old_role, "value") else str(old_role),
                "new_role": data.role.value if hasattr(data.role, "value") else str(data.role),
            },
        )

        db.commit()
        db.refresh(target_pm)

        return ProjectMemberResponse(
            id=target_pm.id,
            project_id=target_pm.project_id,
            user_id=target_pm.user_id,
            role=target_pm.role,
            email=target_user.email if target_user else None,
            name=target_user.full_name if target_user else None,
            created_at=target_pm.created_at,
            updated_at=target_pm.updated_at,
        )

    @staticmethod
    def remove_member(
        db: Session,
        user_id: str,
        project_id: str,
        target_user_id: str,
    ) -> bool:
        """
        Removes a member from a project or allows a member to leave.
        """
        project = ProjectService.get_project_entity(db, user_id, project_id)
        if not project.organization_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Personal projects do not support collaborators.",
            )

        target_pm = db.scalar(
            select(ProjectMember).where(
                ProjectMember.project_id == project.id,
                ProjectMember.user_id == target_user_id,
            )
        )
        if not target_pm:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Project member not found.",
            )

        caller_effective = ProjectService._resolve_effective_role(db, project, user_id)
        if user_id != target_user_id:
            if caller_effective not in [OrgRole.PROJECT_MANAGER, OrgRole.ADMIN, OrgRole.OWNER]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Insufficient permissions to remove project members.",
                )
            if caller_effective == OrgRole.PROJECT_MANAGER and target_pm.role in [OrgRole.ADMIN, OrgRole.OWNER]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Project Managers cannot remove Administrators or Owners.",
                )

        target_user = db.scalar(select(User).where(User.id == target_user_id))

        # Audit Activity Log
        ProjectActivityService.log_activity(
            db=db,
            action=ProjectAction.PROJECT_MEMBER_REMOVED,
            resource_type="project_member",
            resource_id=target_pm.id,
            project_id=project.id,
            organization_id=project.organization_id,
            actor_user_id=user_id,
            metadata={
                "member_user_id": target_user_id,
                "member_name": (target_user.full_name or target_user.first_name) if target_user else None,
                "member_role": target_pm.role.value if hasattr(target_pm.role, "value") else str(target_pm.role),
                "is_self_removal": user_id == target_user_id,
            },
        )

        db.delete(target_pm)
        db.commit()
        return True

    # =========================================================================
    # BOQ OPERATIONS
    # =========================================================================

    @staticmethod
    def add_material(
        db: Session,
        user_id: str,
        project_id: str,
        item: ProjectMaterialCreate,
    ) -> ProjectResponse:
        """
        Adds or updates a material in the BOQ.
        Allowed roles: PROJECT_MANAGER, ADMIN, OWNER.
        """
        project = ProjectService.get_project_entity(
            db,
            user_id,
            project_id,
            required_roles=[
                OrgRole.PROJECT_MANAGER,
                OrgRole.ADMIN,
                OrgRole.OWNER,
            ],
        )

        product = db.scalar(select(Product).where(Product.id == item.product_id))
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product '{item.product_id}' not found in catalog.",
            )

        resolved_price = (
            item.price_at_addition
            if item.price_at_addition is not None
            else product.price
        )

        existing = next((m for m in project.materials if m.product_id == item.product_id), None)
        if existing:
            existing.quantity += item.quantity
            if item.wastage_percent is not None:
                existing.wastage_percent = item.wastage_percent
            if item.purchased_quantity is not None:
                existing.purchased_quantity += item.purchased_quantity
            if item.notes:
                existing.notes = item.notes
            if item.stage:
                existing.stage = item.stage
            existing.updated_at = datetime.now(timezone.utc)
        else:
            new_mat = ProjectMaterial(
                id=str(uuid.uuid4()),
                project_id=project.id,
                product_id=product.id,
                quantity=item.quantity,
                unit=item.unit or product.unit or "Piece",
                purchased_quantity=item.purchased_quantity or Decimal("0.00"),
                wastage_percent=item.wastage_percent or Decimal("0.00"),
                stage=item.stage or project.stage or "Foundation",
                price_at_addition=resolved_price,
                notes=item.notes,
                added_at=datetime.now(timezone.utc),
            )
            db.add(new_mat)

        project.updated_at = datetime.now(timezone.utc)

        # Audit Activity Log
        ProjectActivityService.log_activity(
            db=db,
            action=ProjectAction.BOQ_MATERIAL_ADDED,
            resource_type="project_material",
            resource_id=product.id,
            project_id=project.id,
            organization_id=project.organization_id,
            actor_user_id=user_id,
            metadata={
                "product_id": product.id,
                "product_name": product.name,
                "quantity": float(item.quantity),
                "unit": item.unit or product.unit or "Piece",
                "stage": item.stage or project.stage,
                "price": float(resolved_price),
            },
        )

        db.commit()
        db.refresh(project)
        return ProjectService._to_project_response(db, project, user_id)

    @staticmethod
    def update_material(
        db: Session,
        user_id: str,
        project_id: str,
        product_id: str,
        updates: ProjectMaterialUpdate,
    ) -> ProjectResponse:
        """
        Updates material in BOQ.
        - Core quantity / wastage modifications: PROJECT_MANAGER, ADMIN, OWNER.
        - Purchased quantity / notes: SITE_SUPERVISOR, PROCUREMENT_MANAGER, PROJECT_MANAGER, ADMIN, OWNER.
        - VIEWER: Forbidden.
        """
        project = ProjectService.get_project_entity(
            db,
            user_id,
            project_id,
            required_roles=[
                OrgRole.SITE_SUPERVISOR,
                OrgRole.PROCUREMENT_MANAGER,
                OrgRole.PROJECT_MANAGER,
                OrgRole.ADMIN,
                OrgRole.OWNER,
            ],
        )

        effective_role = ProjectService._resolve_effective_role(db, project, user_id)
        if (updates.quantity is not None or updates.wastage_percent is not None) and effective_role in [OrgRole.SITE_SUPERVISOR, OrgRole.PROCUREMENT_MANAGER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Procurement Managers and Site Supervisors cannot modify core BOQ base quantities or wastage percentages.",
            )

        mat = next((m for m in project.materials if m.product_id == product_id), None)
        if not mat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Material with product_id '{product_id}' not found in project '{project_id}'.",
            )

        old_quantity = mat.quantity
        old_purchased = mat.purchased_quantity
        old_notes = mat.notes

        update_dict = updates.model_dump(exclude_unset=True)
        for key, val in update_dict.items():
            if val is not None:
                setattr(mat, key, val)

        mat.updated_at = datetime.now(timezone.utc)
        project.updated_at = datetime.now(timezone.utc)

        # Audit Activity Log with specialized action categorization
        act_action = ProjectAction.BOQ_MATERIAL_UPDATED
        if updates.purchased_quantity is not None and updates.quantity is None and updates.wastage_percent is None:
            act_action = ProjectAction.PURCHASED_QUANTITY_UPDATED
        elif updates.notes is not None and updates.quantity is None and updates.purchased_quantity is None:
            act_action = ProjectAction.PROCUREMENT_NOTE_UPDATED

        ProjectActivityService.log_activity(
            db=db,
            action=act_action,
            resource_type="project_material",
            resource_id=product_id,
            project_id=project.id,
            organization_id=project.organization_id,
            actor_user_id=user_id,
            metadata={
                "product_id": product_id,
                "product_name": mat.product.name if mat.product else product_id,
                "old_quantity": float(old_quantity),
                "new_quantity": float(mat.quantity),
                "old_purchased_quantity": float(old_purchased),
                "new_purchased_quantity": float(mat.purchased_quantity),
                "stage": mat.stage,
                "notes": mat.notes,
            },
        )

        db.commit()
        db.refresh(project)
        return ProjectService._to_project_response(db, project, user_id)

    @staticmethod
    def remove_material(
        db: Session,
        user_id: str,
        project_id: str,
        product_id: str,
    ) -> ProjectResponse:
        """
        Removes a material from the BOQ.
        Allowed roles: PROJECT_MANAGER, ADMIN, OWNER.
        """
        project = ProjectService.get_project_entity(
            db,
            user_id,
            project_id,
            required_roles=[
                OrgRole.PROJECT_MANAGER,
                OrgRole.ADMIN,
                OrgRole.OWNER,
            ],
        )

        mat = next((m for m in project.materials if m.product_id == product_id), None)
        if not mat:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Material with product_id '{product_id}' not found in project '{project_id}'.",
            )

        # Audit Activity Log
        ProjectActivityService.log_activity(
            db=db,
            action=ProjectAction.BOQ_MATERIAL_REMOVED,
            resource_type="project_material",
            resource_id=product_id,
            project_id=project.id,
            organization_id=project.organization_id,
            actor_user_id=user_id,
            metadata={
                "product_id": product_id,
                "product_name": mat.product.name if mat.product else product_id,
                "quantity": float(mat.quantity),
                "unit": mat.unit,
            },
        )

        db.delete(mat)
        project.updated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(project)
        return ProjectService._to_project_response(db, project, user_id)

    @staticmethod
    def refresh_boq_pricing(db: Session, user_id: str, project_id: str) -> ProjectResponse:
        """
        Refreshes BOQ material price snapshots to current catalog rates.
        Allowed roles: PROCUREMENT_MANAGER, PROJECT_MANAGER, ADMIN, OWNER.
        """
        project = ProjectService.get_project_entity(
            db,
            user_id,
            project_id,
            required_roles=[
                OrgRole.PROCUREMENT_MANAGER,
                OrgRole.PROJECT_MANAGER,
                OrgRole.ADMIN,
                OrgRole.OWNER,
            ],
        )

        for mat in project.materials:
            product = db.scalar(select(Product).where(Product.id == mat.product_id))
            if product:
                mat.price_at_addition = product.price
                mat.updated_at = datetime.now(timezone.utc)

        project.updated_at = datetime.now(timezone.utc)

        # Audit Activity Log
        ProjectActivityService.log_activity(
            db=db,
            action=ProjectAction.BOQ_PRICING_REFRESHED,
            resource_type="project",
            resource_id=project.id,
            project_id=project.id,
            organization_id=project.organization_id,
            actor_user_id=user_id,
            metadata={
                "items_count": len(project.materials),
            },
        )

        db.commit()
        db.refresh(project)
        return ProjectService._to_project_response(db, project, user_id)

    @staticmethod
    def toggle_stage_complete(db: Session, user_id: str, project_id: str, stage: str) -> ProjectResponse:
        """
        Toggles milestone stage completion.
        Allowed roles: SITE_SUPERVISOR, PROJECT_MANAGER, ADMIN, OWNER.
        """
        project = ProjectService.get_project_entity(
            db,
            user_id,
            project_id,
            required_roles=[
                OrgRole.SITE_SUPERVISOR,
                OrgRole.PROJECT_MANAGER,
                OrgRole.ADMIN,
                OrgRole.OWNER,
            ],
        )

        current_stages = list(project.completed_stages or [])
        if stage in current_stages:
            current_stages.remove(stage)
            is_completed = False
        else:
            current_stages.append(stage)
            is_completed = True

        project.completed_stages = current_stages
        project.updated_at = datetime.now(timezone.utc)

        # Audit Activity Log
        ProjectActivityService.log_activity(
            db=db,
            action=ProjectAction.PROJECT_STAGE_UPDATED,
            resource_type="project_stage",
            resource_id=stage,
            project_id=project.id,
            organization_id=project.organization_id,
            actor_user_id=user_id,
            metadata={
                "stage": stage,
                "is_completed": is_completed,
                "completed_stages": current_stages,
            },
        )

        db.commit()
        db.refresh(project)
        return ProjectService._to_project_response(db, project, user_id)
