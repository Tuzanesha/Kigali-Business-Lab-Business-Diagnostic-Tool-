# Kigali Business Lab - Business Diagnostic Tool

A comprehensive business diagnostic tool that helps businesses assess and improve their operations. The application consists of a Django REST API backend and a Next.js frontend.

## Prerequisites

- Docker (v20.10+) and Docker Compose (v2.0+)
- Node.js (v18+)
- Python (v3.9+)
- PostgreSQL (if running locally without Docker)

## Project Structure

```
.
├── kbl-backend/          # Django REST API backend
│   ├── config/           # Django project configuration
│   ├── diagnostic/       # Main app with business logic
│   ├── docker-compose.yml# Docker Compose configuration
│   └── requirements.txt  # Python dependencies
└── kbl_frontend/         # Next.js frontend
    ├── src/              # Source code
    └── package.json      # Node.js dependencies
```

## Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd kbl-business-diagnostic
```

### 2. Set Up Environment Variables

#### Backend (.env in kbl-backend/)
```env
# Database
POSTGRES_DB=kbl_backend
POSTGRES_USER=kbl_user
POSTGRES_PASSWORD=kblUser1234
POSTGRES_HOST=db
POSTGRES_PORT=5432

# Django
DJANGO_SECRET_KEY=your-secret-key-here
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1

# Email Configuration (for production)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
EMAIL_USE_TLS=True
DEFAULT_FROM_EMAIL=your-email@gmail.com

# Frontend URL (for CORS and email links)
FRONTEND_URL=http://localhost:3000
```

#### Frontend (.env.local in kbl_frontend/)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
```

### 3. Run with Docker (Recommended)

```bash
# Start the application
docker-compose -f kbl-backend/docker-compose.yml up -d --build

# Run database migrations
docker-compose -f kbl-backend/docker-compose.yml exec web python manage.py migrate

# Create superuser (admin)
docker-compose -f kbl-backend/docker-compose.yml exec web python manage.py createsuperuser
```

### 4. Run Manually (Without Docker)

#### Backend
```bash
cd kbl-backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

#### Frontend
```bash
cd kbl_frontend
npm install
npm run dev
```

## Accessing the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api
- **Admin Panel**: http://localhost:8000/admin
- **API Documentation**: http://localhost:8000/swagger/

## Development

### Backend Commands

```bash
# Run tests
python manage.py test

# Create migrations
python manage.py makemigrations

# Run migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Import sample data
python manage.py import_questions
```

### Frontend Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Format code
npm run format

# Lint code
npm run lint
```

## Deployment

### Production Environment Variables

Update these in your production environment:

```env
DJANGO_DEBUG=False
DJANGO_ALLOWED_HOSTS=your-domain.com,www.your-domain.com
SECURE_SSL_REDIRECT=True
SESSION_COOKIE_SECURE=True
CSRF_COOKIE_SECURE=True
```

### Database Backups

```bash
# Create backup
docker-compose -f kbl-backend/docker-compose.yml exec -T db pg_dump -U kbl_user kbl_backend > backup_$(date +%Y%m%d).sql

# Restore from backup
cat backup.sql | docker-compose -f kbl-backend/docker-compose.yml exec -T db psql -U kbl_user kbl_backend
```

## Troubleshooting

### Common Issues

1. **Database Connection Issues**
   - Ensure PostgreSQL is running
   - Check database credentials in `.env`
   - Run `python manage.py check --database default`

2. **Email Not Sending**
   - Verify SMTP settings in `.env`
   - Check spam folder
   - For Gmail, enable "Less secure app access" or use App Passwords

3. **Frontend Not Connecting to Backend**
   - Ensure CORS is properly configured
   - Verify `NEXT_PUBLIC_API_URL` in frontend `.env.local`

## License

This project is proprietary software. All rights reserved.

## Support

For support, please contact the development team at [your-email@example.com].
