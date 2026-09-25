import logging
from datetime import timedelta
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.core.security import create_access_token
from app.core.rbac import get_role_permissions
from app.api.dependencies import get_current_active_user
from app.models.user import User
from app.schemas.auth import (
    RegisterRequest,
    LoginRequest,
    TokenResponse,
    UserResponse,
    CurrentUserResponse,
    ChangePasswordRequest,
)
from app.services.auth_service import AuthService

logger = logging.getLogger("hepna.api.auth")
router = APIRouter()


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Customer Account Registration",
    description="Registers a new customer account (Individual, Contractor, or Business) and returns a signed JWT access token.",
)
def register(
    req: RegisterRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    try:
        user = AuthService.register_customer(db, req)
    except ValueError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )

    # Issue initial session JWT access token
    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        subject=user.id,
        role=user.role.value,
        account_type=user.account_type.value,
        expires_delta=expires_delta,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="User Login & Token Generation",
    description="Authenticates user credentials against the PostgreSQL database and returns a cryptographically signed JWT.",
)
def login(
    req: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    user = AuthService.authenticate_user(db, req.email, req.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    token = create_access_token(
        subject=user.id,
        role=user.role.value,
        account_type=user.account_type.value,
        expires_delta=expires_delta,
    )

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        user=UserResponse.model_validate(user),
    )


@router.get(
    "/me",
    response_model=CurrentUserResponse,
    status_code=status.HTTP_200_OK,
    summary="Get Current User Profile & Permissions",
    description="Returns the authenticated user identity and authoritative server-side permissions.",
)
def get_me(
    current_user: User = Depends(get_current_active_user),
) -> CurrentUserResponse:
    role_perms = [p.value for p in get_role_permissions(current_user.role)]
    user_data = UserResponse.model_validate(current_user).model_dump()
    return CurrentUserResponse(
        **user_data,
        permissions=role_perms,
    )


@router.post(
    "/change-password",
    status_code=status.HTTP_200_OK,
    summary="Change User Password",
    description="Updates the user password after verifying current credentials.",
)
def change_password(
    req: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
) -> dict[str, str]:
    success = AuthService.change_password(
        db=db,
        user=current_user,
        current_password=req.current_password,
        new_password=req.new_password,
    )

    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )

    return {"status": "ok", "message": "Password changed successfully."}


@router.post(
    "/logout",
    status_code=status.HTTP_200_OK,
    summary="User Logout",
    description="Acknowledges client session termination. The frontend client discards its stored JWT access token.",
)
def logout() -> dict[str, str]:
    return {
        "status": "ok",
        "message": "Client session terminated successfully.",
    }


@router.post(
    "/seed-dev-users",
    status_code=status.HTTP_200_OK,
    summary="Seed Development Personas (Dev Only)",
    description="Seeds the 9 development personas into PostgreSQL if ENABLE_DEV_SEED_USERS=True.",
)
def seed_dev_users(db: Session = Depends(get_db)) -> dict[str, Any]:
    if not settings.ENABLE_DEV_SEED_USERS:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Development user seeding is disabled in current environment settings.",
        )

    count = AuthService.seed_dev_users_if_enabled(db)
    return {"status": "ok", "seeded_users_count": count}
