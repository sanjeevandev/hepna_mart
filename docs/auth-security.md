# HEPNA MART — Authentication & Authorization Security Architecture

**Document Version:** 1.0.0  
**Status:** Production Standard  
**Backend:** FastAPI / Python  
**Database:** PostgreSQL (`hepna_mart`)  

---

## 1. Authentication Architecture Overview

HEPNA MART adopts an authoritative, stateless token authentication scheme anchored by PostgreSQL persistence:

```
[ Frontend Client ] 
       │ 1. POST /api/v1/auth/login (email, password)
       ▼
[ Rate Limiter Guard ] ──── (Exceeded > 10 req/min) ───► HTTP 429 Too Many Requests
       │
       ▼
[ AuthService ] ──── Argon2id Verification against DB
       │
       ▼
[ JWT Token Signer ] ──── Cryptographically Signed HS256 JWT
       │
       ▼
[ Client Local Storage / Memory ] (Bearer Token)
```

---

## 2. Password Hashing Specification (Argon2id)

HEPNA MART strictly adheres to RFC 9106 password hashing recommendations using the `Argon2id` hybrid algorithm:
- **Algorithm:** Argon2id
- **Memory Cost (`m`):** 64 MiB (`65536` KiB)
- **Time Cost (`t`):** 3 iterations
- **Parallelism (`p`):** 4 lanes
- **Salt Length:** 16 random bytes (CSPRN)
- **Key/Hash Length:** 32 bytes
- **Minimum Password Length:** 8 characters enforced at schema and service layers.

### Legacy Bcrypt Fallback
For backwards compatibility with existing legacy accounts, `verify_password` supports `$2b$`, `$2a$`, and `$2y$` hashes transparently.

---

## 3. JWT Access Token Specification

- **Algorithm:** HMAC-SHA256 (`HS256`)
- **Token Type:** Bearer
- **Default TTL:** 7 days (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- **Required Claims:**
  - `sub`: User UUID string
  - `role`: Canonical role string (`customer`, `admin`, `super_admin`, etc.)
  - `account_type`: `individual`, `contractor`, or `business`
  - `type`: `"access"`
  - `iat`: Epoch issuance timestamp
  - `exp`: Epoch expiration timestamp

---

## 4. Role-Based Access Control (RBAC) Matrix

| Permission Key | Customer | Support Staff | Order Manager | Inventory Manager | Procurement Manager | Admin | Super Admin |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| `products.view` | ✅ (Public) | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `products.create` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `products.update` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `products.delete` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `inventory.view` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| `inventory.update` | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ | ✅ |
| `orders.view` | Own Only | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| `orders.update` | ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| `orders.cancel` | Own (Pending) | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| `quotes.view` | Own Only | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `quotes.manage` | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ | ✅ |
| `payments.view` | Own Only | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| `payments.verify`| ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| `payments.reject`| ❌ | ❌ | ✅ | ❌ | ❌ | ✅ | ✅ |
| `payments.refund`| ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `users.manage` | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ✅ |
| `settings.manage`| ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |

---

## 5. Brute Force & Credential Stuffing Defenses

1. **IP Sliding-Window Rate Limiting:**
   - Limits login attempts to 10 requests per 60 seconds per client IP.
   - Limit registration attempts to 5 requests per 60 seconds per client IP.
2. **Account Status Verification:**
   - Deactivated accounts (`is_active=False`) are rejected immediately with HTTP 403.
3. **Structured Audit Logging:**
   - Every login attempt (success or failure) is logged to `hepna.audit` with IP address, user identifier, and sanitized telemetry.
