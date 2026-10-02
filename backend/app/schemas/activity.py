from datetime import datetime
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict


class ProjectActivityActor(BaseModel):
    id: str
    email: str
    name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProjectActivityResponse(BaseModel):
    id: str
    organization_id: Optional[str] = None
    project_id: Optional[str] = None
    actor_user_id: Optional[str] = None
    actor: Optional[ProjectActivityActor] = None
    action: str
    resource_type: str
    resource_id: Optional[str] = None
    metadata: Dict[str, Any] = Field(default_factory=dict)
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class ProjectActivityListResponse(BaseModel):
    activities: List[ProjectActivityResponse]
    total: int
    page: int
    limit: int

    model_config = ConfigDict(from_attributes=True)
