# HEPNA MART — Production Deployment & Configuration Guide

**Document Version:** 1.0.0  
**Status:** Production Standard  

---

## 1. Production Architecture Topology

```
                  [ HTTPS: 443 / Cloudflare / Nginx ]
                                  │
                  ┌───────────────┴───────────────┐
                  ▼                               ▼
       [ Vite / React Frontend ]        [ FastAPI Backend ]
       (Port 3000 / Static CDN)         (Port 8001 / Uvicorn)
                                                  │
                                                  ▼
                                       [ PostgreSQL Database ]
                                        (Port 5432 / hepna_mart)
```

> **IMPORTANT:** Port 8000 is reserved. FastAPI strictly listens on port 8001.

---

## 2. Environment Variables Matrix

| Variable | Required | Production Value / Pattern | Description |
| :--- | :---: | :--- | :--- |
| `ENVIRONMENT` | Yes | `production` | Enables strict production validations and error sanitization |
| `DEBUG` | Yes | `False` | Disables interactive debuggers and detailed stack trace leaks |
| `SECRET_KEY` | Yes | `[64-character random hex string]` | Secret key used to sign JWT access tokens |
| `DATABASE_URL` | Yes | `postgresql://user:pass@host:5432/hepna_mart` | PostgreSQL connection string |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | No | `10080` (7 days) | Access token expiration period |
| `ENABLE_DEV_SEED_USERS` | Yes | `False` | Must be False in production |
| `RATE_LIMITING_ENABLED` | No | `True` | Activates in-memory sliding window rate limiter |
| `RATE_LIMIT_LOGIN_MAX_REQUESTS` | No | `10` | Max login requests per IP per minute |
| `RATE_LIMIT_REGISTER_MAX_REQUESTS`| No | `5` | Max registration requests per IP per minute |
| `MAX_REQUEST_SIZE_BYTES` | No | `2097152` (2 MB) | Upper limit for HTTP request body |
| `CORS_ORIGINS` | Yes | `https://hepnamart.com,https://admin.hepnamart.com` | Whitelist of allowed client origins |
| `HEPNA_UPI_ID` | Yes | `hepnamart@upi` | Merchant VPA for manual UPI transfers |
| `HEPNA_UPI_DISPLAY_NAME` | Yes | `HEPNA MART` | Business name shown on UPI apps |
| `HEPNA_MANUAL_UPI_ENABLED` | No | `True` | Enables UPI QR payment mode |
| `HEPNA_COD_ENABLED` | No | `True` | Enables Pay on Delivery mode |

---

## 3. Production Security Checklist

- [x] `ENVIRONMENT="production"` configured in production `.env`.
- [x] `DEBUG=False` verified (raises error on startup if True in production).
- [x] `SECRET_KEY` has high cryptographic entropy (>= 32 chars, no "insecure" strings).
- [x] `ENABLE_DEV_SEED_USERS=False` enforced.
- [x] All HTTP responses include defensive headers (`X-Frame-Options`, `X-Content-Type-Options`, `CSP`).
- [x] Sliding-window rate limiter active on auth and payment endpoints.
- [x] Global exception handlers active — no internal python stack traces exposed.
- [x] Daily automated PostgreSQL backup script configured via cron.
- [x] All 140+ automated backend tests passing in CI.
