# Build stage
FROM python:3.13-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DEFAULT_TIMEOUT=100 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set work directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
# Install to system Python instead of user space
RUN pip install --no-cache-dir -r requirements.txt

# Final stage
FROM python:3.13-slim

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set work directory
WORKDIR /app

# Copy Python dependencies from builder
COPY --from=builder /usr/local/lib/python3.13/site-packages /usr/local/lib/python3.13/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy project
COPY . .

# Create necessary directories
RUN mkdir -p /app/staticfiles /app/media

# Collect static files (will be overridden in production)
RUN python manage.py collectstatic --noinput || true

# Use gunicorn as the entrypoint
# Run migrations and collectstatic before starting server
# PORT is provided by Render
CMD python manage.py migrate --noinput && python manage.py collectstatic --noinput && python manage.py import_questions && gunicorn config.wsgi:application --bind 0.0.0.0:${PORT:-8000} --workers 3

# Health check
HEALTHCHECK --interval=30s --timeout=30s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:8000/health/ || exit 1


