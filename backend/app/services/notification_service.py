import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List, Tuple
from fastapi import HTTPException, status
from sqlalchemy import select, func, desc, update
from sqlalchemy.orm import Session, selectinload

from app.models.notification import ProjectNotification
from app.models.activity import ProjectActivityLog, ProjectAction
from app.models.project import Project, ProjectMember
from app.models.organization import Organization, OrganizationMember, OrgRole
from app.models.user import User
from app.schemas.notification import (
    ProjectNotificationResponse,
    ProjectNotificationListResponse,
    NotificationActorSummary,
)

logger = logging.getLogger("hepna.notification_service")


class ProjectNotificationService:
    @staticmethod
    def _sanitize_metadata(metadata: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        clean = dict(metadata or {})
        for sensitive_key in ["password", "token", "secret", "access_token", "api_key", "refresh_token"]:
            if sensitive_key in clean:
                clean[sensitive_key] = "[REDACTED]"
        return clean

    @staticmethod
    def _format_event_text(
        action: str,
        actor_name: str,
        project_name: str,
        metadata: Dict[str, Any],
        is_direct_target: bool = False,
    ) -> Tuple[str, str]:
        """
        Builds standardized human-readable title and message for a project notification.
        """
        m = metadata or {}
        
        if action == ProjectAction.PROJECT_CREATED:
            return (
                "New Project Workspace Created",
                f"{actor_name} created project workspace '{project_name}' in {m.get('city', 'site')}."
            )
        elif action == ProjectAction.PROJECT_UPDATED:
            fields = ", ".join(m.get("updated_fields", [])) or "specifications"
            return (
                "Project Specifications Updated",
                f"{actor_name} updated {fields} for project '{project_name}'."
            )
        elif action == ProjectAction.PROJECT_DELETED:
            return (
                "Project Workspace Deleted",
                f"{actor_name} deleted project workspace '{project_name}'."
            )
        elif action in [ProjectAction.PROJECT_TRANSFERRED, ProjectAction.PROJECT_MOVED_TO_ORGANIZATION]:
            return (
                "Project Transferred to Organization",
                f"{actor_name} transferred project '{project_name}' to an organization workspace."
            )
        elif action == ProjectAction.PROJECT_MOVED_TO_PERSONAL:
            return (
                "Project Converted to Personal Workspace",
                f"{actor_name} converted project '{project_name}' into a private personal project."
            )
        elif action == ProjectAction.BOQ_MATERIAL_ADDED:
            prod_name = m.get("product_name", "Material")
            qty = m.get("quantity", "")
            unit = m.get("unit", "units")
            return (
                "Material Added to BOQ",
                f"{actor_name} added {qty} {unit} of {prod_name} to project '{project_name}'."
            )
        elif action == ProjectAction.BOQ_MATERIAL_UPDATED:
            prod_name = m.get("product_name", "Material")
            old_q = m.get("old_quantity", "")
            new_q = m.get("new_quantity", "")
            return (
                "BOQ Material Quantity Revised",
                f"{actor_name} updated {prod_name} quantity ({old_q} → {new_q}) in project '{project_name}'."
            )
        elif action == ProjectAction.PURCHASED_QUANTITY_UPDATED:
            prod_name = m.get("product_name", "Material")
            purchased_q = m.get("new_purchased_quantity", 0)
            return (
                "Material Delivery Recorded",
                f"{actor_name} recorded {purchased_q} units received for {prod_name} in project '{project_name}'."
            )
        elif action == ProjectAction.PROCUREMENT_NOTE_UPDATED:
            prod_name = m.get("product_name", "Material")
            return (
                "Procurement Note Updated",
                f"{actor_name} updated procurement notes for {prod_name} in project '{project_name}'."
            )
        elif action == ProjectAction.BOQ_MATERIAL_REMOVED:
            prod_name = m.get("product_name", "Material")
            return (
                "Material Removed from BOQ",
                f"{actor_name} removed {prod_name} from project '{project_name}'."
            )
        elif action == ProjectAction.BOQ_PRICING_REFRESHED:
            count = m.get("items_count", 0)
            return (
                "BOQ Pricing Refreshed",
                f"{actor_name} updated price snapshots for {count} BOQ items from live catalog rates in project '{project_name}'."
            )
        elif action == ProjectAction.PROJECT_STAGE_UPDATED:
            st = m.get("stage", "Milestone")
            status_txt = "Completed ✓" if m.get("is_completed") else "In-Progress"
            return (
                "Construction Stage Progress Updated",
                f"{actor_name} marked stage '{st}' as {status_txt} in project '{project_name}'."
            )
        elif action == ProjectAction.PROJECT_MEMBER_ADDED:
            role_label = str(m.get("role", "collaborator")).replace("_", " ")
            if is_direct_target:
                return (
                    "Assigned to Project Workspace",
                    f"You have been assigned to project '{project_name}' as {role_label}."
                )
            target_name = m.get("member_name") or m.get("member_email") or "collaborator"
            return (
                "Team Collaborator Assigned",
                f"{actor_name} assigned {target_name} to project '{project_name}' as {role_label}."
            )
        elif action == ProjectAction.PROJECT_MEMBER_ROLE_UPDATED:
            new_role_label = str(m.get("new_role", "collaborator")).replace("_", " ")
            if is_direct_target:
                return (
                    "Project Role Updated",
                    f"Your role on project '{project_name}' was updated to {new_role_label}."
                )
            target_name = m.get("member_name") or "collaborator"
            return (
                "Collaborator Role Updated",
                f"{actor_name} updated {target_name}'s role on project '{project_name}' to {new_role_label}."
            )
        elif action == ProjectAction.PROJECT_MEMBER_REMOVED:
            if is_direct_target:
                return (
                    "Removed from Project Workspace",
                    f"You were removed from project '{project_name}'."
                )
            target_name = m.get("member_name") or "collaborator"
            return (
                "Collaborator Removed",
                f"{actor_name} removed {target_name} from project '{project_name}'."
            )
        elif action == ProjectAction.ESTIMATE_TRANSFERRED_TO_BOQ:
            est_id = m.get("estimate_id", "")
            items = m.get("transferred_items", 0)
            return (
                "Estimate Transferred to BOQ",
                f"{actor_name} transferred {items} material items from Estimate #{est_id} into project '{project_name}'."
            )
        elif action == ProjectAction.COMMENT_CREATED:
            snippet = m.get("preview") or "a discussion comment"
            return (
                "New Project Discussion Comment",
                f"{actor_name} commented on project '{project_name}': \"{snippet}\""
            )
        elif action == ProjectAction.COMMENT_UPDATED:
            return (
                "Project Comment Edited",
                f"{actor_name} edited a comment on project '{project_name}'."
            )
        elif action == ProjectAction.COMMENT_DELETED:
            return (
                "Project Comment Deleted",
                f"{actor_name} removed a comment from project '{project_name}'."
            )
        else:
            action_title = action.replace("_", " ").title()
            return (
                action_title,
                f"{actor_name} performed {action_title} on project '{project_name}'."
            )

    @staticmethod
    def resolve_recipients(
        db: Session,
        activity_log: ProjectActivityLog,
        project: Optional[Project] = None,
    ) -> List[Tuple[str, bool]]:
        """
        Determines the list of user IDs who should receive notifications for this activity event.
        Returns a list of tuples: (user_id, is_direct_target)
        """
        recipients_map: Dict[str, bool] = {}
        actor_id = activity_log.actor_user_id
        meta = activity_log.metadata_ or {}
        action = activity_log.action

        # If project is not provided and project_id exists, load project
        if not project and activity_log.project_id:
            project = db.scalar(
                select(Project)
                .where(Project.id == activity_log.project_id)
                .options(selectinload(Project.members))
            )

        # 1. Direct Target User (for member events)
        target_user_id = meta.get("member_user_id")
        if target_user_id:
            # The directly affected user receives a direct target notification
            recipients_map[target_user_id] = True

        # 2. Personal Project: notify owner if different from actor
        if project and not project.organization_id:
            if project.user_id and project.user_id != actor_id:
                recipients_map[project.user_id] = False
            return [(uid, is_tgt) for uid, is_tgt in recipients_map.items()]

        # 3. Organization Project: resolve organization and project members
        org_id = activity_log.organization_id or (project.organization_id if project else None)
        if org_id:
            # Org Owners and Admins
            org_admins = db.scalars(
                select(OrganizationMember.user_id).where(
                    OrganizationMember.organization_id == org_id,
                    OrganizationMember.role.in_([OrgRole.OWNER, OrgRole.ADMIN]),
                )
            ).all()
            for admin_uid in org_admins:
                if admin_uid != actor_id and admin_uid not in recipients_map:
                    recipients_map[admin_uid] = False

        # Project Members
        if project and project.members:
            for pm in project.members:
                if pm.user_id != actor_id and pm.user_id not in recipients_map:
                    recipients_map[pm.user_id] = False

        # If project was just created and project object has user_id
        if project and project.user_id and project.user_id != actor_id:
            if project.user_id not in recipients_map:
                recipients_map[project.user_id] = False

        # Always filter out the actor (unless they are a direct target of an action performed by someone else)
        if actor_id in recipients_map and not recipients_map[actor_id]:
            del recipients_map[actor_id]

        return [(uid, is_tgt) for uid, is_tgt in recipients_map.items()]

    @staticmethod
    def create_notifications_for_activity(
        db: Session,
        activity_log: ProjectActivityLog,
        project: Optional[Project] = None,
    ) -> List[ProjectNotification]:
        """
        Creates user-specific ProjectNotification records for a ProjectActivityLog.
        Participates in the active session without committing.
        """
        # Resolve actor name
        actor_name = "Team Member"
        if activity_log.actor_user_id:
            actor = db.scalar(select(User).where(User.id == activity_log.actor_user_id))
            if actor:
                actor_name = actor.full_name or actor.first_name or actor.email
            else:
                actor_name = "Former User"
        else:
            actor_name = "System"

        # Resolve project name
        project_name = "Project"
        meta = activity_log.metadata_ or {}
        if meta.get("name"):
            project_name = meta["name"]
        elif project and project.name:
            project_name = project.name
        elif activity_log.project_id:
            p = db.scalar(select(Project.name).where(Project.id == activity_log.project_id))
            if p:
                project_name = p

        recipients = ProjectNotificationService.resolve_recipients(db, activity_log, project)
        created_notifications: List[ProjectNotification] = []

        clean_metadata = ProjectNotificationService._sanitize_metadata(activity_log.metadata_)
        clean_metadata["actor_name"] = actor_name
        clean_metadata["project_name"] = project_name

        for recipient_id, is_direct_target in recipients:
            title, message = ProjectNotificationService._format_event_text(
                action=activity_log.action,
                actor_name=actor_name,
                project_name=project_name,
                metadata=clean_metadata,
                is_direct_target=is_direct_target,
            )

            notif = ProjectNotification(
                id=f"notif-{uuid.uuid4().hex[:12]}",
                recipient_user_id=recipient_id,
                organization_id=activity_log.organization_id,
                project_id=activity_log.project_id,
                activity_log_id=activity_log.id,
                notification_type=activity_log.action,
                title=title,
                message=message,
                metadata_=clean_metadata,
                is_read=False,
                created_at=datetime.now(timezone.utc),
            )
            db.add(notif)
            created_notifications.append(notif)

        logger.debug(
            "Created %d notifications for activity %s (log_id=%s)",
            len(created_notifications),
            activity_log.action,
            activity_log.id,
        )
        return created_notifications

    @staticmethod
    def list_user_notifications(
        db: Session,
        user_id: str,
        page: int = 1,
        limit: int = 20,
        is_read: Optional[bool] = None,
        notification_type: Optional[str] = None,
        project_id: Optional[str] = None,
    ) -> ProjectNotificationListResponse:
        """
        Lists paginated notifications for the authenticated user only.
        """
        page = max(1, page)
        limit = min(max(1, limit), 100)
        offset = (page - 1) * limit

        base_filter = [ProjectNotification.recipient_user_id == user_id]

        if is_read is not None:
            base_filter.append(ProjectNotification.is_read == is_read)
        if notification_type:
            base_filter.append(ProjectNotification.notification_type == notification_type)
        if project_id:
            base_filter.append(ProjectNotification.project_id == project_id)

        # Count total
        total = db.scalar(
            select(func.count(ProjectNotification.id)).where(*base_filter)
        ) or 0

        # Unread count
        unread_count = db.scalar(
            select(func.count(ProjectNotification.id)).where(
                ProjectNotification.recipient_user_id == user_id,
                ProjectNotification.is_read == False,
            )
        ) or 0

        # Query items with join to project and activity log
        query = (
            select(ProjectNotification, Project.name)
            .outerjoin(Project, Project.id == ProjectNotification.project_id)
            .where(*base_filter)
            .order_by(desc(ProjectNotification.created_at), desc(ProjectNotification.id))
            .offset(offset)
            .limit(limit)
        )
        rows = db.execute(query).all()

        responses: List[ProjectNotificationResponse] = []
        for notif, p_name in rows:
            meta = notif.metadata_ or {}
            actor_summary = None
            if meta.get("actor_name"):
                actor_summary = NotificationActorSummary(
                    name=meta.get("actor_name"),
                    email=meta.get("actor_email"),
                )

            responses.append(
                ProjectNotificationResponse(
                    id=notif.id,
                    recipient_user_id=notif.recipient_user_id,
                    organization_id=notif.organization_id,
                    project_id=notif.project_id,
                    project_name=p_name or meta.get("project_name"),
                    activity_log_id=notif.activity_log_id,
                    notification_type=notif.notification_type,
                    title=notif.title,
                    message=notif.message,
                    metadata=meta,
                    is_read=notif.is_read,
                    read_at=notif.read_at,
                    created_at=notif.created_at,
                    actor=actor_summary,
                )
            )

        return ProjectNotificationListResponse(
            notifications=responses,
            total=total,
            page=page,
            limit=limit,
            unread_count=unread_count,
        )

    @staticmethod
    def get_unread_count(db: Session, user_id: str) -> int:
        """
        Fast count of unread notifications for the user.
        """
        return db.scalar(
            select(func.count(ProjectNotification.id)).where(
                ProjectNotification.recipient_user_id == user_id,
                ProjectNotification.is_read == False,
            )
        ) or 0

    @staticmethod
    def mark_notification_as_read(
        db: Session,
        user_id: str,
        notification_id: str,
    ) -> ProjectNotificationResponse:
        """
        Marks a specific notification as read. Enforces ownership authorization.
        """
        stmt = (
            select(ProjectNotification, Project.name)
            .outerjoin(Project, Project.id == ProjectNotification.project_id)
            .where(ProjectNotification.id == notification_id)
        )
        row = db.execute(stmt).first()
        if not row:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Notification '{notification_id}' not found.",
            )

        notif, p_name = row
        if notif.recipient_user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You do not own this notification.",
            )

        notif.is_read = True
        notif.read_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(notif)

        meta = notif.metadata_ or {}
        actor_summary = None
        if meta.get("actor_name"):
            actor_summary = NotificationActorSummary(
                name=meta.get("actor_name"),
                email=meta.get("actor_email"),
            )

        return ProjectNotificationResponse(
            id=notif.id,
            recipient_user_id=notif.recipient_user_id,
            organization_id=notif.organization_id,
            project_id=notif.project_id,
            project_name=p_name or meta.get("project_name"),
            activity_log_id=notif.activity_log_id,
            notification_type=notif.notification_type,
            title=notif.title,
            message=notif.message,
            metadata=meta,
            is_read=notif.is_read,
            read_at=notif.read_at,
            created_at=notif.created_at,
            actor=actor_summary,
        )

    @staticmethod
    def mark_all_notifications_as_read(db: Session, user_id: str) -> int:
        """
        Marks all unread notifications for the user as read.
        """
        now = datetime.now(timezone.utc)
        stmt = (
            update(ProjectNotification)
            .where(
                ProjectNotification.recipient_user_id == user_id,
                ProjectNotification.is_read == False,
            )
            .values(is_read=True, read_at=now)
        )
        res = db.execute(stmt)
        db.commit()
        return res.rowcount
