from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(default="ok", example="ok")
    service: str = Field(default="hepna-mart-api", example="hepna-mart-api")
    version: str = Field(default="1.0.0", example="1.0.0")


class DatabaseHealthResponse(BaseModel):
    status: str = Field(..., example="ok")
    database: str = Field(..., example="connected")
    engine: Optional[str] = Field(None, example="postgresql")
    latency_ms: Optional[float] = Field(None, example=1.45)
    error: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
