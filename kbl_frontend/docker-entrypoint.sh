#!/bin/sh
# Docker entrypoint script for Next.js frontend
# Handles .env files to avoid macOS Docker read errors
# Next.js will use environment variables directly

set -e

echo "🚀 Starting frontend container..."

# STEP 1: Remove ALL .env files from mounted volume to prevent macOS Docker read errors
# This must happen BEFORE Next.js tries to read them
echo "📝 Step 1: Removing problematic .env files from mounted volume..."
# Try multiple removal methods to ensure files are gone
for file in .env .env.local .env.development .env.production .env.test; do
  rm -f "$file" 2>/dev/null || true
  [ -f "$file" ] && echo "  ⚠️  Warning: Could not remove $file" || echo "  ✅ Removed $file"
done

# Also try find to catch any .env* files
find . -maxdepth 1 -name ".env*" -type f 2>/dev/null | while read -r file; do
  rm -f "$file" 2>/dev/null || true
done

# STEP 2: Create safe empty .env files in /tmp (not on mounted volume)
# Then copy them to override any remaining mounted files
echo "📝 Step 2: Creating safe empty .env files..."
mkdir -p /tmp/env-safe
echo "" > /tmp/env-safe/.env.local
echo "" > /tmp/env-safe/.env

# Copy safe files to app directory (this should work even if mounted files exist)
cp /tmp/env-safe/.env.local .env.local 2>/dev/null || true
cp /tmp/env-safe/.env .env 2>/dev/null || true
chmod 644 .env.local .env 2>/dev/null || true

# STEP 3: Clean up
rm -rf /tmp/env-safe
rm -rf node_modules/.vite 2>/dev/null || true

# STEP 4: Install dependencies if needed
if [ ! -d "node_modules" ] || [ ! -f "node_modules/.package-lock.json" ]; then
  echo "📦 Installing dependencies..."
  npm install --legacy-peer-deps
fi

# STEP 5: Verify environment variables
echo "✅ Environment variables:"
echo "   NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL:-NOT SET}"
echo "   NEXT_PUBLIC_API_URL_SERVER=${NEXT_PUBLIC_API_URL_SERVER:-NOT SET}"
echo ""
echo "📋 Note: Next.js will use NEXT_PUBLIC_* environment variables automatically"
echo "   .env files are empty placeholders to prevent read errors"

# STEP 6: Start Next.js dev server
echo "🎯 Starting Next.js development server..."
exec npm run dev

