import os
from typing import List, Optional, Union
from pydantic import AnyHttpUrl, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PROJECT_NAME: str = "HEPNA MART API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True

    # Security
    SECRET_KEY: str = "dev_insecure_secret_key_please_change_in_production_9918237192"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    ENABLE_DEV_SEED_USERS: bool = False

    # Database
    DATABASE_URL: Optional[str] = "postgresql://postgres:postgres@localhost:5432/hepna_mart"

    # Cart & Pricing Constants
    GST_RATE: float = 0.18
    FREE_DELIVERY_THRESHOLD: float = 5000.0
    STANDARD_DELIVERY_FEE: float = 199.0

    # Payment Configuration
    HEPNA_UPI_ID: str = "hepnamart@upi"
    HEPNA_UPI_DISPLAY_NAME: str = "HEPNA MART"
    HEPNA_UPI_QR_PATH: str = "/images/hepna-upi-qr.png"
    HEPNA_PAYMENT_CURRENCY: str = "INR"
    HEPNA_MANUAL_UPI_ENABLED: bool = True
    HEPNA_COD_ENABLED: bool = True
    HEPNA_PAYMENT_GATEWAY_ENABLED: bool = False

    # Security Hardening & Rate Limiting
    RATE_LIMITING_ENABLED: bool = True
    RATE_LIMIT_LOGIN_MAX_REQUESTS: int = 10
    RATE_LIMIT_LOGIN_WINDOW_SECONDS: int = 60
    RATE_LIMIT_REGISTER_MAX_REQUESTS: int = 5
    RATE_LIMIT_REGISTER_WINDOW_SECONDS: int = 60
    RATE_LIMIT_PAYMENTS_MAX_REQUESTS: int = 20
    RATE_LIMIT_PAYMENTS_WINDOW_SECONDS: int = 60
    RATE_LIMIT_DEFAULT_MAX_REQUESTS: int = 120
    RATE_LIMIT_DEFAULT_WINDOW_SECONDS: int = 60
    MAX_REQUEST_SIZE_BYTES: int = 2 * 1024 * 1024  # 2MB maximum payload size

    # CORS
    CORS_ORIGINS: Union[List[str], str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
        "http://localhost:3002",
        "http://127.0.0.1:3002",
        "http://localhost:3003",
        "http://127.0.0.1:3003",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]

    @field_validator("CORS_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> List[str]:
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",") if i.strip()]
        elif isinstance(v, list):
            return v
        return [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "http://localhost:3003",
            "http://127.0.0.1:3003",
        ]

    def validate_production_settings(self) -> None:
        """
        Validates critical configuration keys in production environment.
        Raises ValueError if unsafe development defaults are retained in production.
        """
        if self.ENVIRONMENT.lower() == "production":
            if self.DEBUG:
                raise ValueError("SECURITY RISK: DEBUG must be set to False in production mode.")
            if "insecure" in self.SECRET_KEY or len(self.SECRET_KEY) < 32:
                raise ValueError("SECURITY RISK: SECRET_KEY must be a cryptographically strong secret with at least 32 characters in production.")
            if self.ENABLE_DEV_SEED_USERS:
                raise ValueError("SECURITY RISK: ENABLE_DEV_SEED_USERS must be False in production mode.")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore",
    )


settings = Settings()

