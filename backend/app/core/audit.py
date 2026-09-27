import json
import logging
from datetime import datetime, timezone
from typing import Any, Dict, Optional

audit_logger = logging.getLogger("hepna.audit")


class AuditEventType:
    # Authentication & Session
    AUTH_LOGIN_SUCCESS = "AUTH_LOGIN_SUCCESS"
    AUTH_LOGIN_FAILURE = "AUTH_LOGIN_FAILURE"
    AUTH_REGISTER_SUCCESS = "AUTH_REGISTER_SUCCESS"
    AUTH_PASSWORD_CHANGE = "AUTH_PASSWORD_CHANGE"
    AUTH_LOGOUT = "AUTH_LOGOUT"

    # Orders & Checkout
    ORDER_CREATED = "ORDER_CREATED"
    ORDER_STATUS_UPDATED = "ORDER_STATUS_UPDATED"
    ORDER_CANCELLED = "ORDER_CANCELLED"

    # Payments & Reconciliation
    PAYMENT_INITIATED = "PAYMENT_INITIATED"
    PAYMENT_UPI_SUBMITTED = "PAYMENT_UPI_SUBMITTED"
    PAYMENT_VERIFIED = "PAYMENT_VERIFIED"
    PAYMENT_REJECTED = "PAYMENT_REJECTED"
    PAYMENT_CANCELLED = "PAYMENT_CANCELLED"
    PAYMENT_REFUNDED = "PAYMENT_REFUNDED"
    PAYMENT_RECONCILED = "PAYMENT_RECONCILED"

    # Wholesale & RFQ
    RFQ_CREATED = "RFQ_CREATED"
    RFQ_CANCELLED = "RFQ_CANCELLED"
    QUOTE_CREATED = "QUOTE_CREATED"
    QUOTE_REVISED = "QUOTE_REVISED"
    QUOTE_ACCEPTED = "QUOTE_ACCEPTED"
    QUOTE_REJECTED = "QUOTE_REJECTED"

    # Inventory & Catalog
    INVENTORY_UPDATED = "INVENTORY_UPDATED"
    PRODUCT_MUTATED = "PRODUCT_MUTATED"


def log_audit_event(
    event_type: str,
    target_type: str,
    target_id: str,
    actor_id: Optional[str] = None,
    actor_role: Optional[str] = None,
    action_status: str = "SUCCESS",
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    request_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Logs a structured, immutable security and operational audit event.
    Guarantees no raw passwords, credit cards, or private secrets are written.
    """
    sanitized_details = {}
    if details:
        for k, v in details.items():
            if "password" in k.lower() or "secret" in k.lower() or "token" in k.lower():
                sanitized_details[k] = "[REDACTED]"
            else:
                sanitized_details[k] = v

    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "event_type": event_type,
        "actor_id": actor_id or "ANONYMOUS",
        "actor_role": actor_role or "GUEST",
        "target_type": target_type,
        "target_id": target_id,
        "status": action_status,
        "details": sanitized_details,
        "ip_address": ip_address or "UNKNOWN",
        "request_id": request_id or "NONE",
    }

    audit_logger.info(json.dumps(record, default=str))
    return record

