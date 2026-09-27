import uuid
import logging
from typing import Callable
from fastapi import FastAPI, Request, Response, HTTPException, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from app.core.config import settings

logger = logging.getLogger("hepna.middleware")


class CorrelationIdMiddleware(BaseHTTPMiddleware):
    """
    Assigns or propagates a unique correlation ID (X-Request-ID) across request and response life cycles.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID")
        if not request_id or len(request_id.strip()) == 0:
            request_id = uuid.uuid4().hex

        request.state.request_id = request_id

        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        return response


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Injects defensive HTTP security headers to protect against clickjacking, MIME sniffing, and XSS.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        response = await call_next(request)

        # Standard OWASP / Production Defensive Headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), camera=(), microphone=()"
        response.headers["Content-Security-Policy"] = "frame-ancestors 'none';"

        return response


class PayloadSizeLimitMiddleware(BaseHTTPMiddleware):
    """
    Enforces a strict upper bound on request payload sizes to prevent memory exhaustion and DoS attacks.
    """

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        content_length = request.headers.get("content-length")
        if content_length:
            try:
                length_int = int(content_length)
                if length_int > settings.MAX_REQUEST_SIZE_BYTES:
                    logger.warning(
                        "Request rejected due to excessive body size: %d bytes (limit: %d bytes)",
                        length_int,
                        settings.MAX_REQUEST_SIZE_BYTES,
                    )
                    return JSONResponse(
                        status_code=status.HTTP_413_CONTENT_TOO_LARGE,
                        content={
                            "detail": f"Payload size exceeds maximum allowed limit of {settings.MAX_REQUEST_SIZE_BYTES} bytes."
                        },
                    )

            except ValueError:
                pass

        return await call_next(request)


def register_exception_handlers(app: FastAPI) -> None:
    """
    Registers global exception handlers to sanitize uncaught internal server errors
    and prevent sensitive stack traces or database connection details from leaking.
    """

    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        request_id = getattr(request.state, "request_id", "unknown")
        logger.error(
            "Unhandled server exception [Request-ID: %s]: %s (%s)",
            request_id,
            str(exc),
            type(exc).__name__,
            exc_info=True,
        )

        # In production, never leak exception internals or stack traces
        if settings.ENVIRONMENT.lower() == "production" or not settings.DEBUG:
            return JSONResponse(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                content={
                    "detail": "An unexpected internal server error occurred. Please quote the Request ID to support.",
                    "request_id": request_id,
                },
                headers={"X-Request-ID": request_id},
            )

        # In development/test mode, provide helpful error context
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "detail": f"Internal Server Error: {str(exc)}",
                "error_type": type(exc).__name__,
                "request_id": request_id,
            },
            headers={"X-Request-ID": request_id},
        )
