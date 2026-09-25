# HEPNA MART — FastAPI + PostgreSQL Backend Foundation

This directory houses the backend REST API for **HEPNA MART**, built with **Python 3**, **FastAPI**, **SQLAlchemy 2.x**, **Alembic**, and **PostgreSQL**.

---

## 🚀 Quick Start & Development Setup

### 1. Create Virtual Environment
```bash
cd backend
python3 -m venv .venv
```

### 2. Activate Virtual Environment
```bash
# On Linux / macOS
source .venv/bin/activate

# On Windows (PowerShell)
.venv\Scripts\Activate.ps1
```

### 3. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Copy `.env.example` to `.env` and verify your PostgreSQL credentials:
```bash
cp .env.example .env
```

Key environment variables:
```env
ENVIRONMENT=development
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/hepna_mart
SECRET_KEY=your_secure_random_key_here
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 5. Create PostgreSQL Database
Ensure your PostgreSQL server is active, then create the database:
```bash
createdb -U postgres hepna_mart
# Or in psql:
# CREATE DATABASE hepna_mart;
```

### 6. Run Database Migrations (Alembic)
```bash
alembic upgrade head
```

To create a new migration after adding SQLAlchemy models:
```bash
alembic revision --autogenerate -m "create_initial_tables"
```

### 7. Start FastAPI Server
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 8. Interactive API Documentation
- **Swagger UI**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)
- **OpenAPI Schema**: [http://localhost:8000/api/v1/openapi.json](http://localhost:8000/api/v1/openapi.json)

### 9. Test API Health Endpoints
```bash
# General Service Health
curl -s http://localhost:8000/api/v1/health

# Response:
# {"status":"ok","service":"hepna-mart-api","version":"1.0.0"}

# Active Database Connectivity Ping
curl -s http://localhost:8000/api/v1/health/db
```

### 10. Start Frontend (React + Vite)
From the project root:
```bash
npm run dev
```
Frontend runs at: [http://localhost:3000](http://localhost:3000)

---

## 📁 Directory Architecture

```
backend/
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI application factory & CORS setup
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py               # Pydantic Settings configuration
│   │   └── database.py             # SQLAlchemy 2.x engine & session dependencies
│   ├── api/
│   │   ├── __init__.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py           # Central v1 endpoint aggregator
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           └── health.py       # Health & DB probe endpoints
│   ├── models/
│   │   ├── __init__.py
│   │   └── base.py                 # DeclarativeBase & Timestamp mixins
│   ├── schemas/
│   │   ├── __init__.py
│   │   └── health.py               # Pydantic v2 health schemas
│   └── services/
│       └── __init__.py             # Business logic layer
├── alembic/
│   ├── versions/                   # Migration script history
│   ├── env.py                      # Alembic runtime environment
│   └── script.py.mako              # Migration template
├── alembic.ini                     # Alembic configuration
├── requirements.txt                # Python dependencies
├── .env.example                    # Environment template
└── README.md                       # Developer setup instructions
```
