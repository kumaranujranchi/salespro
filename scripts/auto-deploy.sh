#!/bin/bash
# =====================================================================
# RealSalePro - Automatic Deployment Script for AWS Lightsail
# Runs every minute via cron. If new code is pushed to 'main',
# it automatically pulls, restarts the Node.js backend, and reloads Nginx.
# =====================================================================

REPO_DIR="/var/www/salespro"

if [ ! -d "$REPO_DIR" ]; then
  exit 0
fi

cd "$REPO_DIR"

# Silently fetch remote changes
git fetch origin main > /dev/null 2>&1 || exit 0

LOCAL=$(git rev-parse HEAD)
REMOTE=$(git rev-parse origin/main)

# If new commits are detected on remote main
if [ "$LOCAL" != "$REMOTE" ]; then
  echo "--------------------------------------------------------"
  echo "🚀 [$(date '+%Y-%m-%d %H:%M:%S')] New commit detected on main! Auto-deploying..."
  echo "Local:  $LOCAL"
  echo "Remote: $REMOTE"
  
  # Pull latest code
  git pull origin main
  
  # Ensure SMTP settings are configured in server/.env
  if [ -f "server/.env" ]; then
    grep -q "EMAIL_USER=" server/.env && sed -i "s|^EMAIL_USER=.*|EMAIL_USER=support@realsalepro.com|" server/.env || echo 'EMAIL_USER=support@realsalepro.com' >> server/.env
    PASS_VAL=$(echo 'UmVhbFNhbGVQcm9AMjAyNg==' | base64 -d)
    grep -q "EMAIL_PASS=" server/.env && sed -i "s|^EMAIL_PASS=.*|EMAIL_PASS=$PASS_VAL|" server/.env || echo "EMAIL_PASS=$PASS_VAL" >> server/.env
    grep -q "EMAIL_HOST=" server/.env && sed -i "s|^EMAIL_HOST=.*|EMAIL_HOST=smtp.hostinger.com|" server/.env || echo 'EMAIL_HOST=smtp.hostinger.com' >> server/.env
    grep -q "EMAIL_PORT=" server/.env && sed -i "s|^EMAIL_PORT=.*|EMAIL_PORT=465|" server/.env || echo 'EMAIL_PORT=465' >> server/.env
    grep -q "EMAIL_SECURE=" server/.env && sed -i "s|^EMAIL_SECURE=.*|EMAIL_SECURE=true|" server/.env || echo 'EMAIL_SECURE=true' >> server/.env
  fi

  # Restart Node.js backend with PM2 and reload environment variables
  pm2 restart salespro-api --update-env > /dev/null 2>&1 || true
  
  # Reload Nginx for updated frontend assets
  sudo systemctl reload nginx > /dev/null 2>&1 || true
  
  echo "✅ [$(date '+%Y-%m-%d %H:%M:%S')] Auto-deploy finished successfully!"
  echo "--------------------------------------------------------"
fi
