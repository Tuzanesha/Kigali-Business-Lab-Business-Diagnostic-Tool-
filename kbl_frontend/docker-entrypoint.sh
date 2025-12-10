#!/bin/sh
# Docker entrypoint script for Next.js frontend
# Handles .env files to avoid macOS Docker read errors
# Next.js will use environment variables directly

set -e

echo "🚀 Starting frontend container..."

# Ensure we're in the correct directory
cd /app || { echo "❌ Error: Cannot cd to /app"; exit 1; }
echo "📁 Working directory: $(pwd)"

# Set up environment variables for npm
export HOME=/root
export npm_config_cache=/tmp/.npm
export npm_config_prefix=/app
# Ensure node_modules/.bin is in PATH
export PATH="/app/node_modules/.bin:$PATH"

# Verify package.json exists
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found in /app"
  echo "   Current directory contents:"
  ls -la /app | head -20
  exit 1
fi
echo "✅ Found package.json"

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
# Check if next binary exists, not just if node_modules exists
NEXT_BIN="./node_modules/.bin/next"
NEXT_BIN_ABS="/app/node_modules/.bin/next"

# Check if we need to install
NEED_INSTALL=false
if [ ! -d "node_modules" ]; then
  NEED_INSTALL=true
  echo "📦 node_modules directory not found, will install dependencies"
elif [ ! -f "$NEXT_BIN" ] && [ ! -f "$NEXT_BIN_ABS" ]; then
  NEED_INSTALL=true
  echo "📦 node_modules exists but 'next' binary not found, will install dependencies"
  echo "   Note: node_modules is a Docker volume, cannot remove it - will install into it"
elif [ ! -f "package-lock.json" ]; then
  NEED_INSTALL=true
  echo "📦 package-lock.json not found, will install dependencies"
fi

if [ "$NEED_INSTALL" = "true" ]; then
  echo "📦 Installing dependencies..."
  echo "   Node version: $(node --version)"
  echo "   NPM version: $(npm --version)"
  echo "   Current directory: $(pwd)"
  echo "   Package.json exists: $([ -f package.json ] && echo 'yes' || echo 'no')"
  
  # Ensure npm cache directory exists
  mkdir -p /tmp/.npm
  mkdir -p /root/.npm
  
  # Clear any problematic npm cache
  npm cache clean --force 2>/dev/null || true
  
  # Install dependencies (npm install will work even if node_modules exists but is incomplete)
  echo "   Starting npm install (this may take several minutes on first run)..."
  echo "   Please wait, installing packages..."
  
  # Run npm install with progress output
  if npm install --legacy-peer-deps; then
    echo "   ✅ npm install completed successfully"
  else
    echo "   ⚠️  First npm install attempt failed, trying with --force..."
    if npm install --legacy-peer-deps --force; then
      echo "   ✅ npm install completed successfully (with --force)"
    else
      echo "❌ npm install failed completely"
      echo "   Attempting to diagnose..."
      echo "   PWD: $(pwd)"
      echo "   HOME: ${HOME:-NOT SET}"
      echo "   NPM cache: ${npm_config_cache:-NOT SET}"
      echo "   Checking node_modules:"
      ls -la node_modules 2>/dev/null | head -5 || echo "   node_modules does not exist or is not accessible"
      echo "   Checking package.json:"
      cat package.json | head -20
      exit 1
    fi
  fi
  
  # Verify next is installed (check both relative and absolute paths)
  if [ ! -f "$NEXT_BIN" ] && [ ! -f "$NEXT_BIN_ABS" ]; then
    echo "❌ Error: 'next' binary still not found after installation"
    echo "   Checking node_modules/.bin contents:"
    if [ -d "node_modules/.bin" ]; then
      ls -la node_modules/.bin/ | head -10
    else
      echo "   node_modules/.bin does not exist"
    fi
    echo "   Checking if node_modules/next exists:"
    ls -la node_modules/next 2>/dev/null | head -5 || echo "   node_modules/next does not exist"
    exit 1
  fi
  echo "✅ Dependencies installed (next binary found)"
else
  echo "✅ Dependencies already installed (next binary found)"
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
echo "   Binding to 0.0.0.0:3000 to allow external connections"

# Verify next binary exists before starting (check both paths)
if [ -f "$NEXT_BIN" ]; then
  NEXT_CMD="$NEXT_BIN"
elif [ -f "$NEXT_BIN_ABS" ]; then
  NEXT_CMD="$NEXT_BIN_ABS"
elif command -v next >/dev/null 2>&1; then
  NEXT_CMD="next"
else
  echo "❌ Error: 'next' binary not found"
  echo "   Checked: $NEXT_BIN"
  echo "   Checked: $NEXT_BIN_ABS"
  echo "   Checked: PATH ($(which next || echo 'not in PATH'))"
  echo "   Please ensure dependencies are installed"
  exit 1
fi

echo "   Using next binary: $NEXT_CMD"

# Use --hostname 0.0.0.0 to bind to all interfaces, not just localhost
# This is required for Docker containers to accept external connections
exec "$NEXT_CMD" dev --hostname 0.0.0.0

