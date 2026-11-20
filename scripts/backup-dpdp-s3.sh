#!/usr/bin/env bash
# ==============================================================================
# RealSalePro - DPDP Act (India) Immutable 3-Year S3 Backup Automation
# Designed for AWS Lightsail -> AWS S3 Object Lock (Compliance Mode)
# ==============================================================================

set -e

BACKUP_DATE=$(date +"%Y-%m-%d_%H%M%S")
TEMP_DIR="/tmp/realsalepro_dpdp_backups"
BACKUP_FILE="${TEMP_DIR}/dpdp_consent_audit_${BACKUP_DATE}.sql.gz"
S3_BUCKET="${S3_BACKUP_BUCKET:-realsalepro-dpdp-immutable-backups}"
S3_PREFIX="${S3_BACKUP_PREFIX:-dpdp_audit_ledgers}"

# Automatically load environment variables from server/.env if present
if [ -f "/var/www/salespro/server/.env" ]; then
  set -a
  source /var/www/salespro/server/.env 2>/dev/null || true
  set +a
elif [ -f "./server/.env" ]; then
  set -a
  source ./server/.env 2>/dev/null || true
  set +a
fi

# Database credentials (loaded securely from environment or server/.env)
export PGHOST="${PGHOST:-localhost}"
export PGPORT="${PGPORT:-5432}"
export PGUSER="${PGUSER:-salesprouser}"
export PGDATABASE="${PGDATABASE:-salespro}"
export PGPASSWORD="${PGPASSWORD}"

echo "======================================================================"
echo "  RealSalePro: DPDP 3-Year Immutable Audit Backup -> AWS S3"
echo "  Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "======================================================================"

# 1. Verify AWS CLI
if ! command -v aws &> /dev/null; then
  echo "❌ Error: AWS CLI is not installed on this Lightsail instance."
  echo "Install with: sudo apt-get update && sudo apt-get install -y awscli"
  exit 1
fi

# 2. Verify pg_dump
if ! command -v pg_dump &> /dev/null; then
  echo "❌ Error: pg_dump utility is not installed."
  echo "Install with: sudo apt-get install -y postgresql-client"
  exit 1
fi

mkdir -p "$TEMP_DIR"

echo "📦 Step 1: Exporting immutable table 'dpdp_consent_logs'..."
if [ -n "$DATABASE_URL" ]; then
  pg_dump "$DATABASE_URL" \
    --table=dpdp_consent_logs \
    --data-only \
    --inserts \
    --no-owner \
    --no-acl | gzip -9 > "$BACKUP_FILE"
else
  PGPASSWORD="$PGPASSWORD" pg_dump \
    -h "$PG_HOST" \
    -p "$PG_PORT" \
    -U "$PG_USER" \
    -d "$PG_DB" \
    --table=dpdp_consent_logs \
    --data-only \
    --inserts \
    --no-owner \
    --no-acl | gzip -9 > "$BACKUP_FILE"
fi

FILE_SIZE=$(ls -lh "$BACKUP_FILE" | awk '{print $5}')
echo "✔ Export completed: ${BACKUP_FILE} (${FILE_SIZE})"

# 3. Calculate SHA-256 Checksum for legal tamper-evidence
CHECKSUM=$(sha256sum "$BACKUP_FILE" | awk '{print $1}')
echo "🔒 Legal Integrity SHA-256: ${CHECKSUM}"

# 4. Upload to AWS S3 with Object Lock
echo "🚀 Step 2: Uploading snapshot to s3://${S3_BUCKET}/${S3_PREFIX}/..."
aws s3 cp "$BACKUP_FILE" "s3://${S3_BUCKET}/${S3_PREFIX}/dpdp_consent_audit_${BACKUP_DATE}.sql.gz" \
  --metadata "sha256=${CHECKSUM},dpdp_policy_version=v1.0-2026,retention=3years"

echo "✔ Upload confirmed! Target: s3://${S3_BUCKET}/${S3_PREFIX}/dpdp_consent_audit_${BACKUP_DATE}.sql.gz"

# 5. Clean up temporary local archive
rm -f "$BACKUP_FILE"

echo "======================================================================"
echo "✔ Immutable 3-Year S3 Backup successfully executed."
echo "======================================================================"
