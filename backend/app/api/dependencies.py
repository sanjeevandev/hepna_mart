import logging
from typing import Callable, Optional, Union
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import decode_access_token
from app.core.rbac import Permission, has_permission, is_staff_role
from app.models.user import User, UserRole
from app.models.organization import Organization, OrganizationMember, OrgRole

logger = logging.getLogger("hepna.dependencies")

# Standard HTTP Bearer token extractor
bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    auth_credentials: Optional[HTTPAuthorizationCredentials] = Security(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    """
    Authoritative dependency to extract and authenticate the requesting user.
    Never trusts frontend claims — validates cryptographic signature and queries PostgreSQL.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate authentication credentials.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if not auth_credentials or not auth_credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token is missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_credentials.credentials
    payload = decode_access_token(token)

    if not payload:
        raise credentials_exception

    user_id: Optional[str] = payload.get("sub")
    if not user_id:
        raise credentials_exception

    # Query authoritative user record from PostgreSQL
    user = db.scalar(select(User).where(User.id == user_id))
    if user is None:
        raise credentials_exception

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is deactivated. Please contact support.",
        )

    return user


def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Returns the authenticated active user.
    """
    return current_user


def require_authenticated_user(current_user: User = Depends(get_current_user)) -> User:
    """
    Alias ensuring the user is valid and authenticated.
    """
    return current_user


def require_staff(current_user: User = Depends(get_current_active_user)) -> User:
    """
    Authorization guard: Restricts access exclusively to internal staff roles.
    Rejects customer accounts with 403 Forbidden.
    """
    if not is_staff_role(current_user.role):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Staff authorization required. Customers cannot access administrative management endpoints.",
        )
    return current_user


def require_admin(current_user: User = Depends(get_current_active_user)) -> User:
    """
    Authorization guard: Requires ADMIN or SUPER_ADMIN role.
    """
    if current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Administrator authorization required for this operation.",
        )
    return current_user


def require_super_admin(current_user: User = Depends(get_current_active_user)) -> User:
    """
    Authorization guard: Requires SUPER_ADMIN role exclusively.
    """
    if current_user.role != UserRole.SUPER_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Super Administrator authorization required for this operation.",
        )
    return current_user


def require_permission(permission: Union[Permission, str]) -> Callable:
    """
    Parameterized dependency factory that verifies specific granular permissions.
    """
    perm_enum = Permission(permission) if isinstance(permission, str) else permission

    def permission_checker(current_user: User = Depends(get_current_active_user)) -> User:
        if not has_permission(current_user.role, perm_enum):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Missing required permission '{perm_enum.value}'.",
            )
        return current_user

    return permission_checker


def get_org_membership(
    org_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> OrganizationMember:
    """
    Authoritative dependency to verify user membership in an organization.
    Ensures customer cross-tenant isolation and IDOR protection.
    """
    membership = db.scalar(
        select(OrganizationMember).where(
            OrganizationMember.organization_id == org_id,
            OrganizationMember.user_id == current_user.id,
        )
    )
    if not membership:
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
    return membership


def require_org_role(allowed_roles: Union[OrgRole, List[OrgRole]]) -> Callable:
    """
    Parameterized dependency factory verifying caller's role within an organization.
    """
    roles_list = [allowed_roles] if isinstance(allowed_roles, OrgRole) else list(allowed_roles)

    def role_checker(membership: OrganizationMember = Depends(get_org_membership)) -> OrganizationMember:
        if membership.role not in roles_list:
            role_names = ", ".join(r.value for r in roles_list)
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied: Requires one of [{role_names}] roles in this organization.",
            )
        return membership

    return role_checker

