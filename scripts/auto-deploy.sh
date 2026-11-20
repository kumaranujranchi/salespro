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

  # If package.json changed or dependencies are missing, install them
  if [ ! -d "node_modules/lenis" ] || git diff --name-only HEAD@{1} HEAD 2>/dev/null | grep -q "package.json"; then
    echo "📦 Installing missing npm dependencies..."
    npm install --no-audit || true
  fi

  # Build frontend Vite production bundle so dist/ assets are updated
  echo "🔨 Building frontend assets (Vite)..."
  NODE_OPTIONS="--max-old-space-size=1536" npm run build || true

  # Restart Node.js backend with PM2 and reload environment variables
  pm2 restart salespro-api --update-env > /dev/null 2>&1 || true
  
  # Reload Nginx for updated frontend assets
  sudo systemctl reload nginx > /dev/null 2>&1 || true
  
  echo "✅ [$(date '+%Y-%m-%d %H:%M:%S')] Auto-deploy finished successfully!"
  echo "--------------------------------------------------------"
fi
