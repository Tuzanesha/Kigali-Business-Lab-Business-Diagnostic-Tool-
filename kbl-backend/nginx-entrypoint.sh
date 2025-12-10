#!/bin/sh
# Nginx entrypoint script to copy config file instead of mounting
# This prevents file locking issues on macOS

set -e

echo "🔧 Setting up nginx configuration..."

# Copy the nginx config file first
if [ -f /nginx-config/nginx.default.conf ]; then
  cp /nginx-config/nginx.default.conf /etc/nginx/conf.d/default.conf
  echo "✅ Copied nginx configuration from volume"
elif [ -f /app/nginx.default.conf ]; then
  cp /app/nginx.default.conf /etc/nginx/conf.d/default.conf
  echo "✅ Copied nginx configuration from /app"
else
  echo "⚠️  Warning: nginx.default.conf not found, using default nginx config"
fi

# Wait for backend to be ready (required for nginx upstream resolution)
echo "⏳ Waiting for backend (web:8000) to be ready..."
MAX_WAIT=120
WAITED=0
while ! wget -q --spider http://web:8000/health/ 2>/dev/null; do
  if [ $WAITED -ge $MAX_WAIT ]; then
    echo "⚠️  Backend not ready after ${MAX_WAIT}s, starting nginx anyway..."
    break
  fi
  echo "   Waiting for web:8000... (${WAITED}s)"
  sleep 5
  WAITED=$((WAITED + 5))
done
if wget -q --spider http://web:8000/health/ 2>/dev/null; then
  echo "✅ Backend is ready!"
fi

# Wait for frontend to be ready (try both container name and service name)
echo "⏳ Waiting for frontend (frontend:3000) to be ready..."
WAITED=0
while ! wget -q --spider http://frontend:3000/ 2>/dev/null && ! wget -q --spider http://kbl-frontend:3000/ 2>/dev/null; do
  if [ $WAITED -ge $MAX_WAIT ]; then
    echo "⚠️  Frontend not ready after ${MAX_WAIT}s, starting nginx anyway..."
    break
  fi
  echo "   Waiting for frontend:3000... (${WAITED}s)"
  sleep 5
  WAITED=$((WAITED + 5))
done
if wget -q --spider http://frontend:3000/ 2>/dev/null || wget -q --spider http://kbl-frontend:3000/ 2>/dev/null; then
  echo "✅ Frontend is ready!"
fi

# Test nginx configuration
echo "🔍 Testing nginx configuration..."
nginx -t

echo "🚀 Starting nginx..."
exec nginx -g "daemon off;"
