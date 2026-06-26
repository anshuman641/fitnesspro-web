#!/usr/bin/env bash
set -euo pipefail

S3_BUCKET="${S3_BUCKET:-}"
CF_DISTRIBUTION_ID="${CF_DISTRIBUTION_ID:-}"

if [[ -z "$S3_BUCKET" || -z "$CF_DISTRIBUTION_ID" ]]; then
  echo "Usage: S3_BUCKET=<bucket-name> CF_DISTRIBUTION_ID=<dist-id> ./deploy.sh"
  echo ""
  echo "Example:"
  echo "  S3_BUCKET=fitness-trainer-web-prod CF_DISTRIBUTION_ID=E1ABC2DEF3GH4I ./deploy.sh"
  exit 1
fi

echo "==> Building production bundle..."
npm run build

echo "==> Syncing dist/ to s3://$S3_BUCKET ..."
aws s3 sync dist/ "s3://$S3_BUCKET" --delete

echo "==> Invalidating CloudFront cache..."
INVALIDATION_ID=$(aws cloudfront create-invalidation \
  --distribution-id "$CF_DISTRIBUTION_ID" \
  --paths "/*" \
  --query 'Invalidation.Id' \
  --output text)

echo "==> Invalidation created: $INVALIDATION_ID"
echo "==> Deploy complete! Site will update once invalidation propagates (usually ~1-2 minutes)."
