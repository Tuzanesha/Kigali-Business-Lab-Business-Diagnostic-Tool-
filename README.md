# KBL Business Diagnostic Tool

A business diagnostic platform with Next.js frontend and Django REST API backend.

## 🚀 Features
- User authentication (JWT)

1. **Clone and set up**
   ```bash
   git clone <repository-url>
   cd kbl-business-diagnostic
   ```

2. **Configure environment**
   - Copy `.env.example` to `.env` in both `kbl-backend` and `kbl_frontend`
   - Update with your configuration

3. **Run with Docker**
   ```bash
   cd kbl-backend
   docker-compose up -d --build
   docker-compose exec web python manage.py migrate
   docker-compose exec web python manage.py createsuperuser

   cd kbl_frontend
   npm run dev
   ```

4. **Access** (via Nginx on port 8080)
   - Main Application: http://localhost:8080
   - Admin Panel: http://localhost:8080/admin
   - API Endpoint: http://localhost:8080/api
   - API Documentation: http://localhost:8080/swagger/

## 🛠 Development

### Backend Development

To work with the backend directly:

1. **Access the API**:
   - Base URL: `http://localhost:8080/api`
   - Test endpoints using tools like Postman or curl
   - Example: `curl http://localhost:8080/api/account/notifications/`

2. **Admin Interface**:
   - Access at: http://localhost:8080/admin
   - Use superuser credentials created during setup

3. **API Documentation**:
   - Interactive Swagger UI: http://localhost:8080/swagger/
   - ReDoc documentation: http://localhost:8080/redoc/

### Backend Commands
```bash
# Run tests
docker-compose exec web python manage.py test

# Create migrations
docker-compose exec web python manage.py makemigrations

# Run linter
docker-compose exec web flake8 .
```

### Frontend
```bash
cd kbl_frontend
npm install
npm run dev  # Development
npm run build  # Production build
npm test  # Run tests
```

## 📦 Deployment

### Production Setup

1. **Server Requirements**
   - Ubuntu 20.04/22.04 LTS
   - Docker & Docker Compose
   - Nginx
   - SSL Certificate (Let's Encrypt)

2. **Nginx Config** (`/etc/nginx/sites-available/kbl`)
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;
       return 301 https://$host$request_uri;
   }

   server {
       listen 443 ssl;
       server_name your-domain.com;

       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/privkey.pem;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
       }

       location /api/ {
           proxy_pass http://localhost:8000;
           proxy_set_header Host $host;
       }
   }
   ```

3. **Environment** (`.env.production`)
   ```env
   DJANGO_DEBUG=False
   DJANGO_ALLOWED_HOSTS=.your-domain.com
   SECURE_SSL_REDIRECT=True
   ```

4. **Deploy**
   ```bash
   # Build and start
   docker-compose -f docker-compose.prod.yml up -d --build
   
   # Run migrations
   docker-compose -f docker-compose.prod.yml exec web python manage.py migrate
   
   # Collect static files
   docker-compose -f docker-compose.prod.yml exec web python manage.py collectstatic --noinput
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

## 🔧 Maintenance

### Backups
```bash
# Database backup
docker exec -t kbl-db pg_dump -U kbl_user -d kbl_backend > backup_$(date +%Y%m%d).sql

# Media backup
rsync -avz /path/to/media/ backup-server:/backups/media/
```

### Logs
```bash
# Nginx logs
sudo tail -f /var/log/nginx/error.log

# Backend logs
docker-compose logs -f web
```

## 📄 License

Proprietary software. All rights reserved.

## 📧 Support

Contact: [kblteam@kbl.rw]
