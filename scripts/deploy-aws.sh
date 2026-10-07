#!/usr/bin/env bash

# Exit immediately if a command exits with a non-zero status
set -e

# Configuration
PROJECT_NAME="realsalepro"
BUILD_DIR="dist"

echo "=========================================="
echo "  Deploying RealSalePro to AWS S3 & CloudFront"
echo "=========================================="

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "❌ Error: AWS CLI is not installed."
    echo "Please install AWS CLI: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
    exit 1
fi

# Check required parameters
if [ -z "$S3_BUCKET" ]; then
    echo "❌ Error: S3_BUCKET variable is not set."
    echo "Usage: S3_BUCKET=your-bucket-name CLOUDFRONT_ID=your-distribution-id ./scripts/deploy-aws.sh"
    exit 1
fi

echo "📦 Step 1: Building production bundle..."
npm run build

echo "🚀 Step 2: Uploading static assets to S3 (s3://${S3_BUCKET})..."
aws s3 sync "$BUILD_DIR" "s3://${S3_BUCKET}" --delete

if [ -n "$CLOUDFRONT_ID" ]; then
    echo "🔄 Step 3: Invalidating CloudFront cache (${CLOUDFRONT_ID})..."
    aws cloudfront create-invalidation --distribution-id "$CLOUDFRONT_ID" --paths "/*"
    echo "✔ CloudFront cache invalidation initiated."
fi

echo "=========================================="
echo "✔ Deployment completed successfully!"
echo "=========================================="
