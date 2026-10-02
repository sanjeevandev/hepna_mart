import logging
from typing import Optional
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.api.dependencies import require_authenticated_user
from app.models.user import User
from app.schemas.notification import (
    ProjectNotificationResponse,
    ProjectNotificationListResponse,
    UnreadCountResponse,
)
from app.services.notification_service import ProjectNotificationService

logger = logging.getLogger("hepna.api.notifications")
router = APIRouter(prefix="/notifications", tags=["Project Notifications & Activity Alerts"])


@router.get("", response_model=ProjectNotificationListResponse)
def list_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    is_read: Optional[bool] = Query(None),
    notification_type: Optional[str] = Query(None),
    project_id: Optional[str] = Query(None),
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Retrieves chronological in-app notifications for the authenticated user.
    """
    return ProjectNotificationService.list_user_notifications(
        db=db,
        user_id=current_user.id,
        page=page,
        limit=limit,
        is_read=is_read,
        notification_type=notification_type,
        project_id=project_id,
    )


@router.get("/unread-count", response_model=UnreadCountResponse)
def get_unread_notification_count(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Returns the total unread notification count for the authenticated user.
    """
    count = ProjectNotificationService.get_unread_count(db, current_user.id)
    return UnreadCountResponse(unread_count=count)


@router.patch("/{notification_id}/read", response_model=ProjectNotificationResponse)
def mark_notification_read(
    notification_id: str,
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Marks a single notification as read. Enforces user ownership.
    """
    return ProjectNotificationService.mark_notification_as_read(
        db=db,
        user_id=current_user.id,
        notification_id=notification_id,
    )


@router.post("/read-all")
def mark_all_notifications_read(
    current_user: User = Depends(require_authenticated_user),
    db: Session = Depends(get_db),
):
    """
    Marks all notifications for the authenticated user as read.
    """
    updated_count = ProjectNotificationService.mark_all_notifications_as_read(
        db=db,
        user_id=current_user.id,
    )
    return {
        "status": "ok",
        "marked_read_count": updated_count,
    }
