import logging
from typing import Generator
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from app.core.config import settings
from app.models.base import Base

logger = logging.getLogger("hepna.database")

# Ensure DATABASE_URL is present
if not settings.DATABASE_URL:
    logger.warning(
        "DATABASE_URL is not configured. Database-dependent endpoints will be unavailable."
    )
    engine = None
    SessionLocal = None
else:
    # Setup connection args for PostgreSQL
    connect_args = {}
    if settings.DATABASE_URL.startswith("sqlite"):
        connect_args["check_same_thread"] = False

    engine = create_engine(
        settings.DATABASE_URL,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        connect_args=connect_args,
    )
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency yielding a database session per request.
    Closes session automatically upon completion or error.
    """
    if SessionLocal is None:
        raise RuntimeError(
            "Database connection is not configured. Please specify DATABASE_URL in environment settings."
        )

    db: Session = SessionLocal()
    try:
        yield db
    finally:
        db.close()
