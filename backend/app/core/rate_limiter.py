import time
import logging
from collections import defaultdict, deque
from threading import Lock
from typing import Dict, Tuple
from fastapi import Request, HTTPException, status
from app.core.config import settings

logger = logging.getLogger("hepna.rate_limiter")


class InMemoryRateLimiter:
    """
    Thread-safe in-memory sliding window rate limiter.
    Maintains a rolling window of request timestamps per key.
    """

    def __init__(self):
        self._records: Dict[str, deque] = defaultdict(deque)
        self._lock = Lock()

    def check(
        self, key: str, max_requests: int, window_seconds: int
    ) -> Tuple[bool, int, int]:
        """
        Evaluates whether a request for the given key is permitted within the sliding window.
        Returns:
            allowed (bool): True if under limit, False if exceeded.
            remaining (int): Remaining requests allowed in current window.
            retry_after (int): Seconds until at least one slot frees up.
        """
        now = time.time()
        cutoff = now - window_seconds

        with self._lock:
            timestamps = self._records[key]

            # Evict timestamps older than current sliding window
            while timestamps and timestamps[0] < cutoff:
                timestamps.popleft()

            current_count = len(timestamps)

            if current_count < max_requests:
                timestamps.append(now)
                remaining = max_requests - current_count - 1
                return True, max(0, remaining), 0
            else:
                # Rate limit exceeded - calculate time until oldest request in window expires
                oldest_timestamp = timestamps[0]
                retry_after = max(1, int(oldest_timestamp + window_seconds - now))
                return False, 0, retry_after

    def reset(self) -> None:
        """
        Clears all stored rate limit history. Useful for unit and integration testing.
        """
        with self._lock:
            self._records.clear()


# Global in-memory rate limiter singleton
rate_limiter = InMemoryRateLimiter()


def get_client_ip(request: Request) -> str:
    """
    Extracts the authoritative client IP address.
    Inspects standard X-Forwarded-For and X-Real-IP reverse proxy headers before falling back to request.client.host.
    """
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        # X-Forwarded-For: <client>, <proxy1>, <proxy2>
        return forwarded.split(",")[0].strip()

    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip.strip()

    if request.client and request.client.host:
        return request.client.host

    return "127.0.0.1"


class RateLimitGuard:
    """
    FastAPI dependency enforcing route-level rate limits.
    """

    def __init__(
        self,
        max_requests: int,
        window_seconds: int,
        key_prefix: str = "general",
    ):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self.key_prefix = key_prefix

    async def __call__(self, request: Request) -> None:
        if not settings.RATE_LIMITING_ENABLED:
            return

        client_ip = get_client_ip(request)
        rate_key = f"{self.key_prefix}:{client_ip}"

        allowed, remaining, retry_after = rate_limiter.check(
            key=rate_key,
            max_requests=self.max_requests,
            window_seconds=self.window_seconds,
        )

        if not allowed:
            logger.warning(
                "Rate limit exceeded for prefix [%s] by IP [%s]. Retry after %d seconds.",
                self.key_prefix,
                client_ip,
                retry_after,
            )
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail="Rate limit exceeded. Too many requests. Please try again later.",
                headers={
                    "Retry-After": str(retry_after),
                    "X-RateLimit-Limit": str(self.max_requests),
                    "X-RateLimit-Remaining": "0",
                    "X-RateLimit-Reset": str(retry_after),
                },
            )
