#!/usr/bin/env bash
# ==============================================================================
# HEPNA MART — Production Database Backup Script
# ==============================================================================
# Safely creates timestamped, compressed PostgreSQL database backups
# Single source of truth: PostgreSQL database 'hepna_mart'
# ==============================================================================

set -euo pipefail

DB_NAME="${DB_NAME:-hepna_mart}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"

BACKUP_DIR="${BACKUP_DIR:-backend/backups}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/hepna_mart_backup_${TIMESTAMP}.sql.gz"

mkdir -p "${BACKUP_DIR}"

echo "=========================================================="
echo " Starting HEPNA MART Database Backup: ${TIMESTAMP}"
echo " Target DB: ${DB_NAME} on ${DB_HOST}:${DB_PORT} (User: ${DB_USER})"
echo " Output:    ${BACKUP_FILE}"
echo "=========================================================="

START_TIME=$(date +%s)

# Execute pg_dump and compress on-the-fly
PGPASSWORD="${PGPASSWORD:-postgres}" pg_dump \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --no-owner \
    --no-acl \
    --clean \
    --if-exists \
    | gzip -9 > "${BACKUP_FILE}"

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

FILE_SIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
SHA256_HASH=$(sha256sum "${BACKUP_FILE}" | cut -d' ' -f1)

echo "✅ Backup Completed Successfully in ${DURATION}s"
echo "📦 Backup File Size: ${FILE_SIZE}"
echo "🔒 SHA256 Checksum:  ${SHA256_HASH}"
echo "=========================================================="
