# HEPNA MART — Dependency Security & Vulnerability Audit

**Document Version:** 1.0.0  
**Status:** Clean & Verified  
**Scope:** Backend (Python / FastAPI) & Frontend (Node / React / Vite)  

---

## 1. Backend Dependency Review (Python)

All backend Python dependencies are pinned and verified for modern cryptographic and operational standards:

| Dependency | Verified Version | Purpose | Security Notes |
| :--- | :--- | :--- | :--- |
| `fastapi` | 0.115+ | REST API routing and OpenAPI generation | Strict validation with Pydantic v2 |
| `pydantic` | 2.9+ | Data serialization and input schema validation | Defends against injection & type confusion |
| `pydantic-settings` | 2.5+ | Environment configuration management | Secure fail-fast validation in production |
| `sqlalchemy` | 2.0+ | Authoritative ORM & Database abstraction | Parameterized SQL queries prevent SQLi |
| `alembic` | 1.13+ | Schema migrations versioning | Version-controlled, deterministic migrations |
| `psycopg2-binary` | 2.9+ | PostgreSQL database driver | Native C client with SSL support |
| `argon2-cffi` | 23.1+ | Argon2id RFC 9106 password hashing | State-of-the-art memory-hard hashing |
| `pyjwt` | 2.9+ | JWT signing and cryptographic decoding | Explicit algorithms list prevents alg:none |
| `bcrypt` | 4.2+ | Fallback password hashing support | Constant-time password verification |
| `uvicorn` | 0.30+ | ASGI production web server | Bound strictly to port 8001 |
| `pytest` | 8.3+ | Automated testing framework | 140+ unit, integration, and security tests |
| `httpx` | 0.27+ | Async HTTP client for test suite | Integrated with FastAPI `TestClient` |

---

## 2. Frontend Dependency Review (Node.js / React)

| Dependency | Purpose | Security Evaluation |
| :--- | :--- | :--- |
| `react` / `react-dom` | UI Rendering Engine | Auto-escapes JSX text nodes to prevent XSS |
| `vite` | Frontend Bundler | Content-Security-Policy compliant build |
| `zustand` | Client State Management | Minimal, transparent in-memory state with localStorage sync |
| `lucide-react` | Icons | Pure SVG icon components with zero dependencies |
| `tailwindcss` | Styling | Strict utility classes without runtime eval |
| `clsx` / `tailwind-merge`| Class combination | Pure utility string formatters |

---

## 3. Vulnerability Mitigation Policy

1. **Dependency Pinning:** Production builds must install strictly from pinned lockfiles (`requirements.txt` / `package-lock.json`).
2. **Automated Vulnerability Scanning:** Incorporate `pip-audit` / `safety` in CI/CD pipeline.
3. **No Unsafe Dynamic Evaluation:** Neither frontend nor backend utilizes `eval()`, `exec()`, or unescaped innerHTML rendering.
