#!/bin/bash
# Startup script for Render deployment
# This ensures migrations run before starting the server

set -e  # Exit on error

echo "=========================================="
echo "Starting KBL Backend Service"
echo "=========================================="

# Wait for database to be ready
echo "Waiting for database connection..."
python << 'EOF'
import os
import sys
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

import time
from django.db import connection

max_retries = 30
retry_count = 0

while retry_count < max_retries:
    try:
        connection.ensure_connection()
        print("✓ Database connection successful")
        sys.exit(0)
    except Exception as e:
        retry_count += 1
        if retry_count >= max_retries:
            print(f"✗ Database connection failed after {max_retries} attempts: {e}")
            sys.exit(1)
        print(f"Database not ready, retrying... ({retry_count}/{max_retries})")
        time.sleep(2)
EOF

# Run migrations
echo ""
echo "Running database migrations..."
python manage.py migrate --noinput
if [ $? -eq 0 ]; then
    echo "✓ Migrations completed successfully"
else
    echo "✗ Migrations failed!"
    exit 1
fi

# Import questions
echo ""
echo "Importing assessment questions..."
python manage.py import_questions || echo "⚠ Question import failed (non-critical)"

# Collect static files
echo ""
echo "Collecting static files..."
python manage.py collectstatic --noinput || echo "⚠ Static files collection failed (non-critical)"

# Start server
echo ""
echo "=========================================="
echo "Starting Gunicorn server..."
echo "=========================================="
exec gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3 --timeout 120

