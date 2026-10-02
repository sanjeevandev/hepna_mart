import logging
import uuid
import re
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import HTTPException, status
from sqlalchemy import select, func, desc, and_
from sqlalchemy.orm import Session, selectinload

from app.models.comment import ProjectComment
from app.models.project import Project, ProjectMember
from app.models.organization import OrganizationMember, OrgRole
from app.models.user import User
from app.models.activity import ProjectAction
from app.services.project_service import ProjectService
from app.services.activity_service import ProjectActivityService
from app.schemas.comment import (
    ProjectCommentCreate,
    ProjectCommentUpdate,
    ProjectCommentResponse,
    ProjectCommentListResponse,
    CommentAuthorSummary,
)

logger = logging.getLogger("hepna.comment_service")


class ProjectCommentService:
    @staticmethod
    def _resolve_author_role(db: Session, project: Project, user_id: str) -> Optional[str]:
        role = ProjectService._resolve_effective_role(db, project, user_id)
        if role:
            return role.value if hasattr(role, "value") else str(role)
        return "collaborator"

    @staticmethod
    def _extract_mentions(content: str, project_members: List[ProjectMember], db: Session) -> List[str]:
        """
        Extracts user IDs for any @mentioned project members in the comment text.
        Supports @username, @email_prefix, or exact email.
        """
        if not content or "@" not in content:
            return []

        mention_matches = set(re.findall(r"@([a-zA-Z0-9_.+-]+)", content))
        if not mention_matches:
            return []

        member_user_ids = [pm.user_id for pm in project_members]
        if not member_user_ids:
            return []

        users = db.scalars(select(User).where(User.id.in_(member_user_ids))).all()
        matched_user_ids = set()

        for u in users:
            email_handle = u.email.split("@")[0].lower() if u.email else ""
            full_name_handle = (u.full_name or "").lower().replace(" ", "")
            first_name_handle = (u.first_name or "").lower()

            for token in mention_matches:
                t = token.lower()
                if t in [email_handle, full_name_handle, first_name_handle] or token == u.id:
                    matched_user_ids.add(u.id)

        return list(matched_user_ids)

    @staticmethod
    def list_comments(
        db: Session,
        user_id: str,
        project_id: str,
        page: int = 1,
        limit: int = 50,
    ) -> ProjectCommentListResponse:
        """
        Lists all discussions/comments on a project for an authorized user.
        """
        project = ProjectService.get_project_entity(db, user_id, project_id)

        page = max(1, page)
        limit = min(max(1, limit), 100)
        offset = (page - 1) * limit

        total = db.scalar(
            select(func.count(ProjectComment.id)).where(ProjectComment.project_id == project_id)
        ) or 0

        stmt = (
            select(ProjectComment, User)
            .join(User, User.id == ProjectComment.user_id)
            .where(ProjectComment.project_id == project_id)
            .order_by(ProjectComment.created_at.asc(), ProjectComment.id.asc())
            .offset(offset)
            .limit(limit)
        )

        rows = db.execute(stmt).all()
        responses: List[ProjectCommentResponse] = []

        for comment, user in rows:
            author_role = ProjectCommentService._resolve_author_role(db, project, user.id)
            author_summary = CommentAuthorSummary(
                id=user.id,
                name=user.full_name or user.first_name or user.email,
                email=user.email,
                role=author_role,
            )
            responses.append(
                ProjectCommentResponse(
                    id=comment.id,
                    project_id=comment.project_id,
                    user_id=comment.user_id,
                    content=comment.content,
                    is_edited=comment.is_edited,
                    created_at=comment.created_at,
                    updated_at=comment.updated_at,
                    author=author_summary,
                )
            )

        return ProjectCommentListResponse(
            comments=responses,
            total=total,
            page=page,
            limit=limit,
        )

    @staticmethod
    def create_comment(
        db: Session,
        user_id: str,
        project_id: str,
        payload: ProjectCommentCreate,
    ) -> ProjectCommentResponse:
        """
        Creates a new collaboration comment on a project.
        """
        project = ProjectService.get_project_entity(db, user_id, project_id)

        clean_content = payload.content.strip()
        if not clean_content:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Comment content cannot be empty or whitespace only.",
            )

        user = db.scalar(select(User).where(User.id == user_id))
        actor_name = user.full_name or user.first_name or user.email if user else "Team Member"

        comment = ProjectComment(
            id=f"comment-{uuid.uuid4().hex[:12]}",
            project_id=project.id,
            user_id=user_id,
            content=clean_content,
            is_edited=False,
            created_at=datetime.now(timezone.utc),
            updated_at=datetime.now(timezone.utc),
        )
        db.add(comment)
        db.flush()

        # Mentions resolution
        mentioned_ids = ProjectCommentService._extract_mentions(
            clean_content, project.members or [], db
        )

        preview = clean_content[:120] + ("..." if len(clean_content) > 120 else "")
        metadata = {
            "comment_id": comment.id,
            "preview": preview,
            "actor_name": actor_name,
            "actor_email": user.email if user else "",
            "mentioned_users": mentioned_ids,
        }

        # Log project activity (automatically creates notifications in the active transaction)
        ProjectActivityService.log_activity(
            db=db,
            action=ProjectAction.COMMENT_CREATED,
            resource_type="comment",
            resource_id=comment.id,
            project_id=project.id,
            organization_id=project.organization_id,
            actor_user_id=user_id,
            metadata=metadata,
        )

        db.commit()
        db.refresh(comment)

        author_role = ProjectCommentService._resolve_author_role(db, project, user_id)
        author_summary = CommentAuthorSummary(
            id=user.id if user else user_id,
            name=actor_name,
            email=user.email if user else "",
            role=author_role,
        )

        return ProjectCommentResponse(
            id=comment.id,
            project_id=comment.project_id,
            user_id=comment.user_id,
            content=comment.content,
            is_edited=comment.is_edited,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
            author=author_summary,
        )

    @staticmethod
    def update_comment(
        db: Session,
        user_id: str,
        project_id: str,
        comment_id: str,
        payload: ProjectCommentUpdate,
    ) -> ProjectCommentResponse:
        """
        Updates a comment. Only the comment author can edit their comment.
        """
        project = ProjectService.get_project_entity(db, user_id, project_id)

        clean_content = payload.content.strip()
        if not clean_content:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Comment content cannot be empty or whitespace only.",
            )

        comment = db.scalar(
            select(ProjectComment).where(
                ProjectComment.id == comment_id,
                ProjectComment.project_id == project_id,
            )
        )
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Comment '{comment_id}' not found on project '{project_id}'.",
            )

        if comment.user_id != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only edit your own comments.",
            )

        comment.content = clean_content
        comment.is_edited = True
        comment.updated_at = datetime.now(timezone.utc)

        user = db.scalar(select(User).where(User.id == user_id))
        actor_name = user.full_name or user.first_name or user.email if user else "Team Member"

        preview = clean_content[:120] + ("..." if len(clean_content) > 120 else "")
        metadata = {
            "comment_id": comment.id,
            "preview": preview,
            "actor_name": actor_name,
        }

        ProjectActivityService.log_activity(
            db=db,
            action=ProjectAction.COMMENT_UPDATED,
            resource_type="comment",
            resource_id=comment.id,
            project_id=project.id,
            organization_id=project.organization_id,
            actor_user_id=user_id,
            metadata=metadata,
        )

        db.commit()
        db.refresh(comment)

        author_role = ProjectCommentService._resolve_author_role(db, project, user_id)
        author_summary = CommentAuthorSummary(
            id=user.id if user else user_id,
            name=actor_name,
            email=user.email if user else "",
            role=author_role,
        )

        return ProjectCommentResponse(
            id=comment.id,
            project_id=comment.project_id,
            user_id=comment.user_id,
            content=comment.content,
            is_edited=comment.is_edited,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
            author=author_summary,
        )

    @staticmethod
    def delete_comment(
        db: Session,
        user_id: str,
        project_id: str,
        comment_id: str,
    ) -> None:
        """
        Deletes a comment. Authorized for author or Project Manager / Org Admin / Org Owner.
        """
        project = ProjectService.get_project_entity(db, user_id, project_id)

        comment = db.scalar(
            select(ProjectComment).where(
                ProjectComment.id == comment_id,
                ProjectComment.project_id == project_id,
            )
        )
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Comment '{comment_id}' not found on project '{project_id}'.",
            )

        effective_role = ProjectService._resolve_effective_role(db, project, user_id)
        is_privileged = effective_role in [OrgRole.OWNER, OrgRole.ADMIN, OrgRole.PROJECT_MANAGER]

        if comment.user_id != user_id and not is_privileged:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied. You can only delete your own comments unless you are a Project Manager or Admin.",
            )

        user = db.scalar(select(User).where(User.id == user_id))
        actor_name = user.full_name or user.first_name or user.email if user else "Team Member"

        metadata = {
            "comment_id": comment.id,
            "deleted_by": user_id,
            "actor_name": actor_name,
        }

        db.delete(comment)

        ProjectActivityService.log_activity(
            db=db,
            action=ProjectAction.COMMENT_DELETED,
            resource_type="comment",
            resource_id=comment_id,
            project_id=project.id,
            organization_id=project.organization_id,
            actor_user_id=user_id,
            metadata=metadata,
        )

        db.commit()
