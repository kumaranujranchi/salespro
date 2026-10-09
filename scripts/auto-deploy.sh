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
  
  # Restart Node.js backend with PM2
  pm2 restart salespro-api > /dev/null 2>&1 || true
  
  # Reload Nginx for updated frontend assets
  sudo systemctl reload nginx > /dev/null 2>&1 || true
  
  echo "✅ [$(date '+%Y-%m-%d %H:%M:%S')] Auto-deploy finished successfully!"
  echo "--------------------------------------------------------"
fi
