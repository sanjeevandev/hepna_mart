# HEPNA MART — Production Deployment & Operations Guide

HEPNA MART is a modern construction material marketplace and procurement platform engineered with **React + Vite** (Frontend), **FastAPI** (Backend REST API), and **PostgreSQL** (Relational Database).

---

## 1. System Architecture Topology

```
                         [ HTTPS: 443 / Reverse Proxy (Nginx / Caddy) ]
                                                │
                       ┌────────────────────────┴────────────────────────┐
                       ▼                                                 ▼
            [ Frontend Static Assets ]                          [ FastAPI Backend ]
            (SPA Routing / dist / CDN)                          (Uvicorn / Port 8001)
                                                                         │
                                                                         ▼
                                                              [ PostgreSQL Database ]
                                                               (Port 5432 / hepna_mart)
```

---

## 2. Prerequisites & Environment Setup

### System Requirements
- **Node.js**: v18+ or v20+ LTS
- **Python**: v3.11+ or v3.12+ (v3.14 compatible)
- **PostgreSQL**: v15+ or v16+
- **Reverse Proxy**: Nginx / Caddy / Cloudflare

---

## 3. Production Environment Configuration

### Frontend Environment (`.env`)
Create a `.env` in the repository root for production builds:
```env
# Point to reverse-proxy relative path or authoritative API origin
VITE_API_BASE_URL=/api/v1
```

### Backend Environment (`backend/.env`)
Create `backend/.env` with production values:
```env
# Application Runtime
ENVIRONMENT=production
DEBUG=False
PROJECT_NAME="HEPNA MART API"
VERSION=1.0.0
API_V1_STR=/api/v1

# Security & Cryptography (Generate: openssl rand -hex 32)
SECRET_KEY=generate_a_secure_64_character_hex_key_here_for_production
ACCESS_TOKEN_EXPIRE_MINUTES=10080
ENABLE_DEV_SEED_USERS=False

# PostgreSQL Connection String
DATABASE_URL=postgresql://hepna_user:secure_password@localhost:5432/hepna_mart

# CORS Allowed Origins (Comma-separated)
CORS_ORIGINS=https://hepnamart.com,https://admin.hepnamart.com

# Payment Gateway / UPI Merchant Configuration
HEPNA_UPI_ID=hepnamart@upi
HEPNA_UPI_DISPLAY_NAME=HEPNA MART
HEPNA_UPI_QR_PATH=/images/hepna-upi-qr.png
HEPNA_PAYMENT_CURRENCY=INR
HEPNA_MANUAL_UPI_ENABLED=True
HEPNA_COD_ENABLED=True
HEPNA_PAYMENT_GATEWAY_ENABLED=False

# Rate Limiting & Resource Guards
RATE_LIMITING_ENABLED=True
RATE_LIMIT_LOGIN_MAX_REQUESTS=10
RATE_LIMIT_LOGIN_WINDOW_SECONDS=60
RATE_LIMIT_REGISTER_MAX_REQUESTS=5
RATE_LIMIT_REGISTER_WINDOW_SECONDS=60
RATE_LIMIT_PAYMENTS_MAX_REQUESTS=20
RATE_LIMIT_PAYMENTS_WINDOW_SECONDS=60
MAX_REQUEST_SIZE_BYTES=2097152
```

---

## 4. Database Setup, Migrations & Seeding

### 1. Initialize PostgreSQL Database
```bash
createdb -U postgres -h localhost hepna_mart
```

### 2. Apply Database Migrations (Alembic)
```bash
cd backend
source .venv/bin/activate
alembic upgrade head
```

### 3. Seed Authoritative Material Catalog (12 Categories, 62 Products, Inventory)
```bash
PYTHONPATH=. python scripts/seed_catalog.py
```

---

## 5. Frontend Production Build

From the repository root:
```bash
# 1. Typecheck
npx tsc --noEmit -p tsconfig.app.json

# 2. Build production bundle into dist/
npm run build
```
- Compiled assets are generated in `dist/`.
- Entry JS bundle: ~320 kB (gzip: ~87 kB).
- Code-split route chunks and vendor chunks (`vendor-react`, `vendor-motion`).

---

## 6. Backend Production Startup

Run the FastAPI application via Uvicorn with multiple workers or systemd:
```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8001 --workers 4 --proxy-headers --forwarded-allow-ips='*'
```

### Example Systemd Service (`/etc/systemd/system/hepna-backend.service`)
```ini
[Unit]
Description=HEPNA MART FastAPI Production Backend
After=network.target postgresql.service

[Service]
User=hepna
WorkingDirectory=/home/sanjeeva/HEPNA MART/backend
EnvironmentFile=/home/sanjeeva/HEPNA MART/backend/.env
ExecStart=/home/sanjeeva/HEPNA MART/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8001 --workers 4 --proxy-headers
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

---

## 7. Reverse Proxy & Static Asset Caching (Nginx Reference)

```nginx
server {
    listen 80;
    server_name hepnamart.com www.hepnamart.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hepnamart.com www.hepnamart.com;

    # SSL Certificates
    ssl_certificate /etc/letsencrypt/live/hepnamart.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/hepnamart.com/privkey.pem;

    # Root directory for frontend SPA
    root /home/sanjeeva/HEPNA MART/dist;
    index index.html;

    client_max_body_size 2M;

    # Static Assets — Long-Lived Immutable Caching
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    # API Proxy Routing to FastAPI Backend
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }

    # SPA Fallback Routing
    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

---

## 8. Health Checks & Observability

- **Liveness Probe**: `GET /api/v1/health` $\to$ Returns service status and version (`200 OK`).
- **Readiness / DB Probe**: `GET /api/v1/health/db` $\to$ Pings PostgreSQL connection (`SELECT 1`) with latency reporting.
- **Correlation ID**: Every incoming and outgoing request carries `X-Request-ID`.
- **Structured Audit Logging**: Sensitive fields (passwords, tokens, UTRs) are automatically redacted from logs.

---

## 9. Backup & Disaster Recovery

- **Automated Backup**:
  ```bash
  ./backend/scripts/backup_postgres.sh
  ```
  Creates gzip-compressed timestamped dumps (`backend/backups/hepna_mart_backup_YYYYMMDD_HHMMSS.sql.gz`) with SHA-256 verification.

- **Database Restore**:
  ```bash
  ./backend/scripts/restore_postgres.sh backend/backups/hepna_mart_backup_YYYYMMDD_HHMMSS.sql.gz
  ```
  Performs pre-restore confirmation and post-restore baseline count validation.


---

## 10. Phase 2L Architecture & Collaboration Features

HEPNA MART provides an end-to-end B2B construction project workspace:
1. **Business & Contractor Profiles (Phase 2L.1)**: Company registration, GSTIN/PAN verification, and tier verification.
2. **Customer Organizations & RBAC (Phase 2L.2)**: Multi-user organizations, team roles (`OWNER`, `ADMIN`, `PROJECT_MANAGER`, `PROCUREMENT_MANAGER`, `SITE_SUPERVISOR`, `VIEWER`), and email invitation flows.
3. **Shared Projects & Project Members (Phase 2L.3)**: Shared workspace delegation, project-level role assignments, effective role capping, and transfer of ownership.
4. **Project Activity & Audit Logs (Phase 2L.4)**: Server-authoritative append-only audit trail logging every project mutation and stage transition.
5. **Project Notifications & Activity Alerts (Phase 2L.5)**: Transactional in-app notification center alerting project collaborators and organization admins with unread count tracking.
6. **Project Collaboration & Discussions (Phase 2L.6)**: Real-time project discussions, rich comment feed, @mention resolution, inline comment editing, role badges, and full authorization-enforced discussion moderation.

### Project Collaboration API Reference
- `GET /api/v1/projects/{project_id}/comments` — List project comments with author metadata (supports pagination).
- `POST /api/v1/projects/{project_id}/comments` — Create discussion comment and notify collaborators.
- `PATCH /api/v1/projects/{project_id}/comments/{comment_id}` — Edit comment (author only).
- `DELETE /api/v1/projects/{project_id}/comments/{comment_id}` — Delete comment (author or project manager / admin).

---

## 11. Verification & Quality Assurance

Run the automated test suite and deployment verification:
```bash
# 1. Frontend TypeScript Validation
npx tsc --noEmit

# 2. Frontend Production Build
npm run build

# 3. Backend Pytest Suite (214 tests)
PYTHONPATH=backend pytest backend/tests -v
```

