#!/bin/bash
# Build script for Render deployment

set -o errexit

echo "Building application..."

# Run migrations
python manage.py migrate --noinput

# Collect static files
python manage.py collectstatic --noinput

echo "Build complete!"

