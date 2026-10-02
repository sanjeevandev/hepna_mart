from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class NotificationActorSummary(BaseModel):
    id: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProjectNotificationResponse(BaseModel):
    id: str
    recipient_user_id: str
    organization_id: Optional[str] = None
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    activity_log_id: Optional[str] = None
    notification_type: str
    title: str
    message: str
    metadata: Dict[str, Any] = Field(default_factory=dict)
    is_read: bool
    read_at: Optional[datetime] = None
    created_at: datetime
    actor: Optional[NotificationActorSummary] = None

    model_config = ConfigDict(from_attributes=True)


class ProjectNotificationListResponse(BaseModel):
    notifications: List[ProjectNotificationResponse]
    total: int
    page: int
    limit: int
    unread_count: int

    model_config = ConfigDict(from_attributes=True)


class UnreadCountResponse(BaseModel):
    unread_count: int

    model_config = ConfigDict(from_attributes=True)
