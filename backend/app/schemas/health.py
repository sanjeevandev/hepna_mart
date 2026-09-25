from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(default="ok")
    service: str = Field(default="hepna-mart-api")
    version: str = Field(default="1.0.0")


class DatabaseHealthResponse(BaseModel):
    status: str
    database: str
    engine: Optional[str] = None
    latency_ms: Optional[float] = None
    error: Optional[str] = None
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

