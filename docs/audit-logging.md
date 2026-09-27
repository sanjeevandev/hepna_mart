# HEPNA MART — Production Audit Logging & Telemetry Specification

**Document Version:** 1.0.0  
**Status:** Production Standard  
**Logger:** `hepna.audit`  

---

## 1. Objective & Scope

Structured audit logging provides a cryptographically trackable, tamper-evident log stream of all security-sensitive and financially material actions in HEPNA MART. Audit logs support compliance, security forensics, fraud detection, and regulatory inspections.

---

## 2. Event Types & Taxonomy

| Event Type | Domain | Trigger | Logged Details |
| :--- | :--- | :--- | :--- |
| `AUTH_LOGIN_SUCCESS` | Security | Successful password/JWT authentication | `actor_id`, `actor_role`, `email`, `ip_address`, `request_id` |
| `AUTH_LOGIN_FAILURE` | Security | Incorrect password or unknown user | `target_id` (email), `reason`, `ip_address`, `request_id` |
| `AUTH_REGISTER_SUCCESS`| Security | New customer account registered | `actor_id`, `email`, `account_type`, `ip_address` |
| `AUTH_PASSWORD_CHANGE` | Security | Password updated | `actor_id`, `action_status` (SUCCESS/FAILURE) |
| `ORDER_CREATED` | Commerce | Order placed and checkout finalized | `order_id`, `order_number`, `total_amount`, `item_count` |
| `ORDER_CANCELLED` | Commerce | Order cancelled by customer or staff | `order_id`, `reason`, `restored_inventory_skus` |
| `PAYMENT_INITIATED` | Finance | Payment transaction record initialized | `payment_id`, `order_id`, `payment_method`, `amount` |
| `PAYMENT_UPI_SUBMITTED`| Finance | Customer submits UPI UTR reference | `payment_id`, `utr_reference`, `order_id`, `amount` |
| `PAYMENT_VERIFIED` | Finance | Staff verifies payment with bank record | `payment_id`, `order_id`, `verified_by_admin_id`, `notes` |
| `PAYMENT_REJECTED` | Finance | Staff rejects invalid/fraudulent UTR | `payment_id`, `order_id`, `reason`, `rejected_by_admin_id`|
| `PAYMENT_REFUNDED` | Finance | Staff logs customer refund | `payment_id`, `order_id`, `amount`, `reason` |
| `PAYMENT_RECONCILED` | Finance | System synchronizes payment & order status| `payment_id`, `admin_id`, `synced_fields` |
| `QUOTE_ACCEPTED` | Wholesale| Customer approves wholesale quote | `quote_id`, `rfq_id`, `order_id`, `final_total` |
| `INVENTORY_UPDATED` | Logistics| Stock level adjustment or reservation | `product_id`, `sku`, `old_quantity`, `new_quantity` |

---

## 3. Log Record Schema

All audit records are emitted as single-line JSON objects to stdout / centralized log collectors:

```json
{
  "timestamp": "2026-09-26T17:45:00.123456+00:00",
  "event_type": "PAYMENT_VERIFIED",
  "actor_id": "usr_adm_9981",
  "actor_role": "admin",
  "target_type": "payment",
  "target_id": "pay_8827361",
  "status": "SUCCESS",
  "details": {
    "order_id": "ord_110293",
    "status": "verified",
    "notes": "Verified against HDFC Bank statement UTR 429188273611"
  },
  "ip_address": "203.0.113.45",
  "request_id": "7b8a9c1d-4e2f-4a0b-9c8d-1e2f3a4b5c6d"
}
```

---

## 4. Privacy & Sensitive Field Redaction

The audit logging module (`backend/app/core/audit.py`) automatically intercepts and redacts sensitive keywords from detail dictionaries:
- `password` → `[REDACTED]`
- `secret_key` → `[REDACTED]`
- `token` → `[REDACTED]`
- `cvv` / `card_number` → `[REDACTED]`

No plaintext passwords or cryptographic keys are ever written to disk or log streams.
