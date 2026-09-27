# HEPNA MART — Database Backup & Disaster Recovery Runbook

**Document Version:** 1.0.0  
**Status:** Production Standard  
**Database Name:** `hepna_mart`  
**Host:** `localhost` (Port: 5432)  

---

## 1. Backup Strategy Overview

HEPNA MART relies on PostgreSQL as the single authoritative source of truth. To prevent data loss and support Point-In-Time Recovery (PITR):

- **Full Daily Backups:** Executed every 24 hours via `backend/scripts/backup_postgres.sh`.
- **Pre-Deployment Backups:** Executed immediately prior to running any Alembic database migration.
- **Retention Policy:**
  - Daily backups: Retained for 30 days.
  - Weekly backups: Retained for 90 days.
  - Monthly archives: Retained for 1 calendar year in encrypted off-site cloud storage.

---

## 2. Automated Backup Execution

Use the production backup script located in `backend/scripts/backup_postgres.sh`:

```bash
# Execute backup with default environment variables
./backend/scripts/backup_postgres.sh

# Or execute with custom parameters
DB_NAME=hepna_mart DB_HOST=localhost DB_PORT=5432 BACKUP_DIR=/var/backups/hepna ./backend/scripts/backup_postgres.sh
```

### Output Artefacts
- **File Format:** Gzip-compressed SQL dump (`.sql.gz`)
- **Naming Scheme:** `hepna_mart_backup_YYYYMMDD_HHMMSS.sql.gz`
- **Integrity Validation:** SHA256 checksum calculated and logged upon completion.

---

## 3. Database Restore & Recovery Procedure

To restore a database backup, use `backend/scripts/restore_postgres.sh`:

```bash
# Interactive restore (requires explicit 'CONFIRM' prompt)
./backend/scripts/restore_postgres.sh backend/backups/hepna_mart_backup_20260926_231500.sql.gz

# Non-interactive / Automated CI restore
./backend/scripts/restore_postgres.sh backend/backups/hepna_mart_backup_20260926_231500.sql.gz --force
```

### Post-Restore Verification Checklist
The restore script automatically checks the restored database against canonical catalog baselines:
1. `SELECT COUNT(*) FROM categories;` (Must be >= 12)
2. `SELECT COUNT(*) FROM products;` (Must be >= 62)
3. `SELECT COUNT(*) FROM inventory;` (Must be >= 62)
4. Verify table integrity using `python3 backend/scripts/verify_phase2h_postgres.py`.
