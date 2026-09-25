from typing import Any, Dict
from fastapi import APIRouter, Depends, status
from app.api.dependencies import require_staff, require_admin, require_super_admin, require_permission
from app.core.rbac import Permission
from app.models.user import User

router = APIRouter()


@router.get(
    "/staff-access-test",
    status_code=status.HTTP_200_OK,
    summary="Test Staff Authorization",
    description="Requires any internal staff role. Rejects customer accounts with 403 Forbidden.",
)
def test_staff_access(current_user: User = Depends(require_staff)) -> Dict[str, Any]:
    return {
        "status": "ok",
        "message": "Staff authorization verified successfully.",
        "user_id": current_user.id,
        "email": current_user.email,
        "role": current_user.role.value,
    }


@router.get(
    "/admin-access-test",
    status_code=status.HTTP_200_OK,
    summary="Test Administrator Authorization",
    description="Requires ADMIN or SUPER_ADMIN role.",
)
def test_admin_access(current_user: User = Depends(require_admin)) -> Dict[str, Any]:
    return {
        "status": "ok",
        "message": "Administrator authorization verified successfully.",
        "user_id": current_user.id,
        "role": current_user.role.value,
    }


@router.get(
    "/super-admin-access-test",
    status_code=status.HTTP_200_OK,
    summary="Test Super Admin Authorization",
    description="Requires SUPER_ADMIN role exclusively.",
)
def test_super_admin_access(current_user: User = Depends(require_super_admin)) -> Dict[str, Any]:
    return {
        "status": "ok",
        "message": "Super Administrator authorization verified successfully.",
        "user_id": current_user.id,
        "role": current_user.role.value,
    }


@router.get(
    "/pricing-permission-test",
    status_code=status.HTTP_200_OK,
    summary="Test Specific Granular Permission",
    description="Requires pricing.manage permission.",
)
def test_pricing_permission(
    current_user: User = Depends(require_permission(Permission.PRICING_MANAGE)),
) -> Dict[str, Any]:
    return {
        "status": "ok",
        "message": "Permission 'pricing.manage' verified successfully.",
        "user_id": current_user.id,
        "role": current_user.role.value,
    }
