from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict, Field


class CommentAuthorSummary(BaseModel):
    id: str
    name: Optional[str] = None
    email: str
    role: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)


class ProjectCommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000, description="Comment text")


class ProjectCommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000, description="Updated comment text")


class ProjectCommentResponse(BaseModel):
    id: str
    project_id: str
    user_id: str
    content: str
    is_edited: bool = False
    created_at: datetime
    updated_at: datetime
    author: Optional[CommentAuthorSummary] = None

    model_config = ConfigDict(from_attributes=True)


class ProjectCommentListResponse(BaseModel):
    comments: List[ProjectCommentResponse]
    total: int
    page: int = 1
    limit: int = 50

    model_config = ConfigDict(from_attributes=True)
