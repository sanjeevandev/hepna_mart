import logging
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional, Union
import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError, VerificationError, InvalidHashError
import bcrypt

from app.core.config import settings

logger = logging.getLogger("hepna.security")

# Initialize Argon2id password hasher (RFC 9106 recommended parameters)
_argon2_hasher = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16,
)

JWT_ALGORITHM = "HS256"


def hash_password(password: str) -> str:
    """
    Hashes a plaintext password using Argon2id.
    """
    if not password or len(password.strip()) < 8:
        raise ValueError("Password must be at least 8 characters long.")
    return _argon2_hasher.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plaintext password against an Argon2id or bcrypt hash.
    Never exposes passwords in log outputs.
    """
    if not plain_password or not hashed_password:
        return False

    # 1. Try Argon2id verification
    if hashed_password.startswith("$argon2"):
        try:
            return _argon2_hasher.verify(hashed_password, plain_password)
        except (VerifyMismatchError, VerificationError, InvalidHashError):
            return False
        except Exception as exc:
            logger.error("Unexpected error during Argon2 verification: %s", type(exc).__name__)
            return False

    # 2. Fallback to bcrypt verification (for compatibility)
    if hashed_password.startswith("$2b$") or hashed_password.startswith("$2a$") or hashed_password.startswith("$2y$"):
        try:
            return bcrypt.checkpw(
                plain_password.encode("utf-8"),
                hashed_password.encode("utf-8")
            )
        except Exception as exc:
            logger.error("Unexpected error during bcrypt verification: %s", type(exc).__name__)
            return False

    logger.warning("Unrecognized password hash scheme format.")
    return False


def create_access_token(
    subject: str,
    role: str,
    account_type: str,
    expires_delta: Optional[timedelta] = None,
    extra_claims: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Generates a cryptographically signed JWT access token.
    Contains minimal required identity claims without sensitive PII.
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload: Dict[str, Any] = {
        "sub": str(subject),
        "role": str(role),
        "account_type": str(account_type),
        "type": "access",
        "iat": int(now.timestamp()),
        "exp": int(expire.timestamp()),
    }

    if extra_claims:
        payload.update(extra_claims)

    encoded_jwt = jwt.encode(payload, settings.SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Decodes and cryptographically validates a JWT access token.
    Returns the payload dictionary or raises jwt exceptions.
    """
    try:
        decoded = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[JWT_ALGORITHM],
            options={"require": ["exp", "sub", "iat"]},
        )
        return decoded
    except jwt.PyJWTError:
        return None
