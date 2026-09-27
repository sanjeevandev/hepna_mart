# HEPNA MART — Payment Security & Fraud Prevention Review

**Document Version:** 1.0.0  
**Status:** Production Standard  
**Backend:** FastAPI / Python  
**Database:** PostgreSQL (`hepna_mart`)  

---

## 1. Payment Processing Architecture

HEPNA MART implements an authoritative payment lifecycle state machine specifically engineered for high-value construction and industrial material transactions in India (Manual UPI QR payments and Cash on Delivery / Pay on Delivery):

```
       [ Customer Places Order ]
                  │
                  ▼
       [ Payment Initialized: PENDING ]
                  │
                  ├── (Customer Submits UPI UTR)
                  ▼
       [ State: AWAITING_VERIFICATION ]
                  │
                  ├── (Admin / Staff Verifies against Bank Statement)
                  │       ├── MATCH ────► [ State: VERIFIED ] ──► (Order -> Processing)
                  │       └── MISMATCH ──► [ State: FAILED ] ────► (Order -> Pending/Cancelled)
                  │
                  └── (Order Cancelled by Customer before submission)
                          ▼
                  [ State: CANCELLED ]
```

---

## 2. Key Security Mechanisms & Controls

### 2.1 Server-Authoritative Amount Enforcement
- The client NEVER specifies or controls the payment amount.
- The amount is calculated strictly on the backend by querying the authoritative `Order.total_amount` from PostgreSQL.

### 2.2 UTR / Transaction Reference Uniqueness & Anti-Collision
- `provider_reference` is mapped to a UNIQUE database index on `payments.provider_reference`.
- If an attacker or customer attempts to submit a UTR that was already submitted for another payment, PostgreSQL rejects the insert/update with a unique constraint violation, and the API returns `HTTP 400 Bad Request`.

### 2.3 Idempotent Verification
- The `POST /api/v1/admin/payments/{payment_id}/verify` endpoint executes inside an atomic database transaction.
- If a staff member clicks "Verify" multiple times, the state machine verifies the payment once and updates the linked order to `processing` / `paid` idempotently without double deductions or state corruption.

### 2.4 Customer vs Admin Boundaries
- Customers can only view their OWN payments (`GET /api/v1/payments/{payment_id}` checks `payment.user_id == current_user.id`).
- Customers CANNOT call verification, rejection, refund, or reconciliation endpoints (protected by `require_permission(Permission.PAYMENTS_VERIFY)`).

### 2.5 Audit Trail Immutability
- Every state transition generates a row in `payment_events` recording:
  - `old_status`, `new_status`, `event_type`
  - `created_by_user_id` (admin staff ID or customer ID)
  - `timestamp` (UTC)
  - `metadata` payload

### 2.6 Rate Limiting on Payment Endpoints
- `POST /api/v1/payments/{payment_id}/submit-upi` is rate limited to 20 requests per 60 seconds per IP to prevent UTR brute-forcing.

---

## 3. Financial Reconciliation Subsystem

The `PaymentReconciliationService` performs cross-table consistency checks:
- Verifies that every order marked `paid` corresponds to a `verified` payment.
- Flags payments that are `verified` where the order is still `pending`.
- Provides an automated reconciliation endpoint `POST /api/v1/admin/payments/{payment_id}/reconcile` for authorized staff.
