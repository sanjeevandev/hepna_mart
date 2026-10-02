import logging
import uuid
from datetime import datetime, timezone
from typing import Optional, Dict, Any, List
from sqlalchemy import select, func, desc
from sqlalchemy.orm import Session

from app.models.activity import ProjectActivityLog, ProjectAction
from app.models.user import User
from app.schemas.activity import (
    ProjectActivityResponse,
    ProjectActivityListResponse,
    ProjectActivityActor,
)

logger = logging.getLogger("hepna.activity_service")


class ProjectActivityService:
    @staticmethod
    def log_activity(
        db: Session,
        action: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        project_id: Optional[str] = None,
        organization_id: Optional[str] = None,
        actor_user_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> ProjectActivityLog:
        """
        Creates and adds an append-only activity log within the active DB session.
        Does NOT commit directly to allow transactional participation.
        """
        clean_meta = dict(metadata or {})
        
        # Redact any accidental credential/token fields from metadata
        for sensitive_key in ["password", "token", "secret", "access_token", "api_key"]:
            if sensitive_key in clean_meta:
                clean_meta[sensitive_key] = "[REDACTED]"

        log_entry = ProjectActivityLog(
            id=f"act-{uuid.uuid4().hex[:12]}",
            organization_id=organization_id,
            project_id=project_id,
            actor_user_id=actor_user_id,
            action=action,
            resource_type=resource_type,
            resource_id=resource_id,
            metadata_=clean_meta,
            created_at=datetime.now(timezone.utc),
        )
        db.add(log_entry)
        # Automatically create project notifications in the same transaction
        try:
            from app.services.notification_service import ProjectNotificationService
            ProjectNotificationService.create_notifications_for_activity(db, log_entry)
        except Exception as e:
            logger.warning("Failed to auto-generate notifications for activity %s: %s", action, e)

        logger.debug(
            "Logged project activity %s on project %s (actor: %s)",
            action,
            project_id,
            actor_user_id,
        )
        return log_entry

    @staticmethod
    def list_project_activities(
        db: Session,
        user_id: str,
        project_id: str,
        page: int = 1,
        limit: int = 50,
        action: Optional[str] = None,
    ) -> ProjectActivityListResponse:
        """
        Fetches chronological activity logs for a project.
        Enforces access authorization via ProjectService.get_project_entity.
        """
        # Local import to prevent circular import between ProjectService and ProjectActivityService
        from app.services.project_service import ProjectService

        # 1. Enforce user authorization on the project
        project = ProjectService.get_project_entity(db, user_id, project_id)

        # 2. Build query
        page = max(1, page)
        limit = min(max(1, limit), 100)
        offset = (page - 1) * limit

        query = (
            select(ProjectActivityLog, User)
            .outerjoin(User, User.id == ProjectActivityLog.actor_user_id)
            .where(ProjectActivityLog.project_id == project.id)
        )

        count_query = (
            select(func.count(ProjectActivityLog.id))
            .where(ProjectActivityLog.project_id == project.id)
        )

        if action:
            query = query.where(ProjectActivityLog.action == action)
            count_query = count_query.where(ProjectActivityLog.action == action)

        total = db.scalar(count_query) or 0

        query = query.order_by(desc(ProjectActivityLog.created_at)).offset(offset).limit(limit)
        results = db.execute(query).all()

        activity_responses: List[ProjectActivityResponse] = []
        for log, user in results:
            actor = None
            if user:
                actor = ProjectActivityActor(
                    id=user.id,
                    email=user.email,
                    name=user.full_name or user.first_name,
                )
            activity_responses.append(
                ProjectActivityResponse(
                    id=log.id,
                    organization_id=log.organization_id,
                    project_id=log.project_id,
                    actor_user_id=log.actor_user_id,
                    actor=actor,
                    action=log.action,
                    resource_type=log.resource_type,
                    resource_id=log.resource_id,
                    metadata=log.metadata_ or {},
                    created_at=log.created_at,
                )
            )

        return ProjectActivityListResponse(
            activities=activity_responses,
            total=total,
            page=page,
            limit=limit,
        )
