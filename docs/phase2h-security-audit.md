# HEPNA MART — Phase 2H Security & Hardening Audit Report

**Document Version:** 1.0.0  
**Status:** Completed & Production-Hardened  
**Authoritative Backend:** FastAPI (`http://127.0.0.1:8001`)  
**Authoritative Database:** PostgreSQL (`hepna_mart` on port 5432)  
**Catalog Baseline:** 12 Categories | 62 Products | 62 Inventory Records  

---

## 1. Executive Summary

Phase 2H accomplishes comprehensive production hardening, defense-in-depth security enforcement, and reliability assurance for HEPNA MART. The objective of Phase 2H is to secure all perimeter endpoints, enforce strict database-level tenancy and customer isolation, defend against credential stuffing and brute force attacks via configurable sliding-window rate limiting, sanitize error telemetry to eliminate sensitive data leakage, implement structured audit logging for all security and financial lifecycle events, and establish verified database backup and disaster recovery procedures.

---

## 2. Threat Modeling & Attack Surface Evaluation

| Threat Vector | Severity | Vulnerability Risk | Implemented Defensive Control | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Credential Stuffing / Brute Force** | High | Automated dictionary attacks against `/api/v1/auth/login` | In-memory sliding window rate limiter (10 req/min) returning HTTP 429 and `Retry-After` header | **Mitigated** |
| **Tampered / Stolen Tokens** | Critical | Signature manipulation or algorithm downgrade attacks | Cryptographically signed HS256 JWTs with explicit expiration validation and sub claim lookup in PostgreSQL | **Mitigated** |
| **Horizontal Privilege Escalation (BOLA)** | Critical | Customer accessing another customer's orders, cart, or payment data | Strict user ownership checks in PostgreSQL SQL query layer; unauthorized ID lookup returns HTTP 404 | **Mitigated** |
| **Vertical Privilege Escalation (RBAC)** | Critical | Customers or unauthorized staff invoking admin/procurement APIs | Server-side role resolution from DB and granular permission guards (`require_permission`, `require_staff`) | **Mitigated** |
| **Payment Reference Tampering / Duplicate UTR** | High | Customer submitting fake or duplicate transaction reference IDs | Unique index constraint on `provider_reference`, state machine transitions, and admin manual verification | **Mitigated** |
| **Denial of Service via Giant Payloads** | Medium | Memory exhaustion via unbounded JSON body sizes | `PayloadSizeLimitMiddleware` rejecting requests > 2MB with HTTP 413 | **Mitigated** |
| **Clickjacking & MIME-Sniffing** | Low | Embedding frontend in malicious iframes or CSS injection | `SecurityHeadersMiddleware` setting `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `CSP` | **Mitigated** |
| **Information Leakage via 500 Errors** | Medium | Exposing PostgreSQL connection strings or python tracebacks | Global exception handler sanitizing error details in production and attaching correlation `X-Request-ID` | **Mitigated** |

---

## 3. Implemented Security Controls

### 3.1 Perimeter & Transport Security
- **HTTP Security Headers:** Injected by `SecurityHeadersMiddleware` on every response:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Permissions-Policy: geolocation=(), camera=(), microphone=()`
  - `Content-Security-Policy: frame-ancestors 'none';`
- **Correlation ID Tracking:** `CorrelationIdMiddleware` assigns or preserves `X-Request-ID` on all incoming requests and outgoing responses, enabling end-to-end distributed tracing.
- **Request Size Limiting:** `PayloadSizeLimitMiddleware` blocks payloads larger than `settings.MAX_REQUEST_SIZE_BYTES` (2 MB default).

### 3.2 Authentication & Password Security
- **Password Hashing:** Argon2id (RFC 9106) with memory cost 64MB, time cost 3, parallelism 4, 32-byte hash length, and 16-byte salt length. Legacy bcrypt fallback supported for backwards compatibility.
- **Access Tokens:** Signed HS256 JWTs containing subject (`sub`), role (`role`), account type (`account_type`), and timestamps (`iat`, `exp`). Secret key entropy is validated on startup in production.

### 3.3 Authorization & RBAC
- Granular permissions matrix (`Permission` enum) governing 16 domain actions.
- Multi-tier staff hierarchy (`SUPER_ADMIN`, `ADMIN`, `PROCUREMENT_MANAGER`, `INVENTORY_MANAGER`, `ORDER_MANAGER`, `SUPPORT_STAFF`).
- Public and customer accounts strictly prevented from executing management or verification actions.

### 3.4 Rate Limiting Architecture
- Sliding window log implementation with thread-safe lock mechanisms.
- Configurable per-route thresholds:
  - Auth Login: 10 requests / 60 seconds
  - Auth Register: 5 requests / 60 seconds
  - Payment UTR Submission: 20 requests / 60 seconds
  - General API: 120 requests / 60 seconds
- Returns standard RFC 6585 status `HTTP 429 Too Many Requests` with `Retry-After`, `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers.

### 3.5 Structured Audit Logging
- Dedicated structured JSON audit logger (`hepna.audit`) tracking critical operational events.
- Automatic PII and credential redaction for passwords, secrets, and authorization tokens.

---

## 4. Verification & Testing Summary

1. **Automated Pytest Security Test Suite:**
   - Security headers verification on all routes.
   - Correlation ID propagation and auto-generation.
   - Rate limiting triggers and header inspection.
   - Token signature tampering, algorithm confusion, and expiration rejection.
   - Horizontal and vertical access control boundaries.
   - PII redaction in audit logs.
2. **PostgreSQL Authoritative Verification:**
   - `backend/scripts/verify_phase2h_postgres.py` executed against live database.
   - 12 categories, 62 products, 62 inventory records confirmed intact.
