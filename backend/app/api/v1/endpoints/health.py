import time
from datetime import datetime
from fastapi import APIRouter, Depends, status, Response
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db, SessionLocal
from app.schemas.health import HealthResponse, DatabaseHealthResponse

router = APIRouter()


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Service Health Check",
    description="Returns the operational status and version of the HEPNA MART API.",
    status_code=status.HTTP_200_OK,
)
def get_health() -> HealthResponse:
    return HealthResponse(
        status="ok",
        service="hepna-mart-api",
        version=settings.VERSION,
    )


@router.get(
    "/health/db",
    response_model=DatabaseHealthResponse,
    summary="Database Connectivity Check",
    description="Performs an active connectivity ping (SELECT 1) against the configured PostgreSQL database.",
)
def get_db_health(response: Response) -> DatabaseHealthResponse:
    if SessionLocal is None:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return DatabaseHealthResponse(
            status="degraded",
            database="not_configured",
            error="DATABASE_URL is not configured in application settings.",
            timestamp=datetime.utcnow(),
        )

    start_time = time.perf_counter()
    try:
        db = SessionLocal()
        try:
            # Execute lightweight probe query
            db.execute(text("SELECT 1"))
            latency_ms = round((time.perf_counter() - start_time) * 1000, 2)
            engine_name = db.bind.dialect.name if db.bind else "unknown"

            return DatabaseHealthResponse(
                status="ok",
                database="connected",
                engine=engine_name,
                latency_ms=latency_ms,
                timestamp=datetime.utcnow(),
            )
        finally:
            db.close()
    except Exception as exc:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return DatabaseHealthResponse(
            status="degraded",
            database="disconnected",
            error=str(exc),
            timestamp=datetime.utcnow(),
        )
