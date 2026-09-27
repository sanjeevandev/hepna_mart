#!/usr/bin/env bash
# ==============================================================================
# HEPNA MART — Production Database Restore Script
# ==============================================================================
# Restores a compressed SQL backup (.sql.gz) into PostgreSQL 'hepna_mart'
# Includes safety checks and post-restore integrity verification
# ==============================================================================

set -euo pipefail

DB_NAME="${DB_NAME:-hepna_mart}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"

if [ $# -lt 1 ]; then
    echo "❌ Error: Missing backup file argument."
    echo "Usage: $0 <path_to_backup_file.sql.gz> [--force]"
    exit 1
fi

BACKUP_FILE="$1"
FORCE_FLAG="${2:-}"

if [ ! -f "${BACKUP_FILE}" ]; then
    echo "❌ Error: Backup file '${BACKUP_FILE}' does not exist."
    exit 1
fi

echo "=========================================================="
echo " HEPNA MART Database Restore Utility"
echo " Target DB: ${DB_NAME} on ${DB_HOST}:${DB_PORT} (User: ${DB_USER})"
echo " Source:    ${BACKUP_FILE}"
echo "=========================================================="

if [ "${FORCE_FLAG}" != "--force" ]; then
    read -p "⚠️ WARNING: This will overwrite data in database '${DB_NAME}'. Type 'CONFIRM' to proceed: " CONFIRMATION
    if [ "${CONFIRMATION}" != "CONFIRM" ]; then
        echo "Restore cancelled by user."
        exit 0
    fi
fi

START_TIME=$(date +%s)
echo "Decompressing and applying SQL dump..."

export PGPASSWORD="${PGPASSWORD:-postgres}"

gunzip -c "${BACKUP_FILE}" | psql \
    -h "${DB_HOST}" \
    -p "${DB_PORT}" \
    -U "${DB_USER}" \
    -d "${DB_NAME}" \
    --quiet

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

echo "=========================================================="
echo " Validating restored data integrity against baseline..."
echo "=========================================================="

CAT_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "SELECT COUNT(*) FROM categories;")
PROD_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "SELECT COUNT(*) FROM products;")
INV_COUNT=$(psql -h "${DB_HOST}" -p "${DB_PORT}" -U "${DB_USER}" -d "${DB_NAME}" -t -A -c "SELECT COUNT(*) FROM inventory;")

echo "Categories: ${CAT_COUNT} (Expected: >= 12)"
echo "Products:   ${PROD_COUNT} (Expected: >= 62)"
echo "Inventory:  ${INV_COUNT} (Expected: >= 62)"

if [ "${CAT_COUNT}" -ge 12 ] && [ "${PROD_COUNT}" -ge 62 ] && [ "${INV_COUNT}" -ge 62 ]; then
    echo "✅ Database restore and baseline validation SUCCESSFUL in ${DURATION}s."
else
    echo "⚠️ Warning: Restored table counts do not meet expected catalog baselines."
    exit 1
fi
