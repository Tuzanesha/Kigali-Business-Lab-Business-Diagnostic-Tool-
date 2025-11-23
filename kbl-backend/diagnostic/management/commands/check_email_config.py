"""
Management command to check email configuration
Run: python manage.py check_email_config
"""
from django.core.management.base import BaseCommand
from django.conf import settings
import os


class Command(BaseCommand):
    help = 'Check email configuration settings'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== Email Configuration Check ===\n'))
        
        # Check DEBUG mode
        debug = getattr(settings, 'DEBUG', False)
        self.stdout.write(f'DEBUG mode: {debug}')
        
        # Check EMAIL_BACKEND
        email_backend = getattr(settings, 'EMAIL_BACKEND', 'Not set')
        self.stdout.write(f'EMAIL_BACKEND: {email_backend}')
        
        if 'console' in email_backend.lower():
            self.stdout.write(self.style.WARNING('⚠️  Using console backend - emails will NOT be sent!'))
            self.stdout.write(self.style.WARNING('   Set EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend in production'))
        elif 'smtp' in email_backend.lower():
            self.stdout.write(self.style.SUCCESS('✅ Using SMTP backend'))
        else:
            self.stdout.write(self.style.WARNING(f'⚠️  Unknown backend: {email_backend}'))
        
        # Check SMTP settings
        self.stdout.write('\n=== SMTP Settings ===')
        email_host = getattr(settings, 'EMAIL_HOST', 'Not set')
        email_port = getattr(settings, 'EMAIL_PORT', 'Not set')
        email_use_tls = getattr(settings, 'EMAIL_USE_TLS', 'Not set')
        email_user = getattr(settings, 'EMAIL_HOST_USER', 'Not set')
        email_password = getattr(settings, 'EMAIL_HOST_PASSWORD', 'Not set')
        default_from = getattr(settings, 'DEFAULT_FROM_EMAIL', 'Not set')
        
        self.stdout.write(f'EMAIL_HOST: {email_host}')
        self.stdout.write(f'EMAIL_PORT: {email_port}')
        self.stdout.write(f'EMAIL_USE_TLS: {email_use_tls}')
        self.stdout.write(f'EMAIL_HOST_USER: {email_user}')
        self.stdout.write(f'EMAIL_HOST_PASSWORD: {"*" * len(str(email_password)) if email_password and email_password != "Not set" else "Not set"}')
        self.stdout.write(f'DEFAULT_FROM_EMAIL: {default_from}')
        
        # Validation
        self.stdout.write('\n=== Validation ===')
        issues = []
        
        if 'console' in email_backend.lower() and not debug:
            issues.append('Using console backend in production - emails will not be sent!')
        
        if 'smtp' in email_backend.lower():
            if not email_user or email_user == 'Not set':
                issues.append('EMAIL_HOST_USER is not set')
            if not email_password or email_password == 'Not set':
                issues.append('EMAIL_HOST_PASSWORD is not set')
            if email_host == 'Not set' or not email_host:
                issues.append('EMAIL_HOST is not set')
            if default_from == 'Not set' or not default_from:
                issues.append('DEFAULT_FROM_EMAIL is not set')
        
        if issues:
            self.stdout.write(self.style.ERROR('\n❌ Issues found:'))
            for issue in issues:
                self.stdout.write(self.style.ERROR(f'  - {issue}'))
        else:
            self.stdout.write(self.style.SUCCESS('\n✅ Email configuration looks good!'))
        
        # Environment variables check
        self.stdout.write('\n=== Environment Variables ===')
        env_vars = [
            'EMAIL_BACKEND',
            'EMAIL_HOST',
            'EMAIL_PORT',
            'EMAIL_USE_TLS',
            'EMAIL_HOST_USER',
            'EMAIL_HOST_PASSWORD',
            'DEFAULT_FROM_EMAIL',
            'DJANGO_DEBUG',
        ]
        
        for var in env_vars:
            value = os.getenv(var, 'Not set')
            if 'PASSWORD' in var and value != 'Not set':
                value = '*' * len(value)
            self.stdout.write(f'{var}: {value}')
        
        self.stdout.write('\n=== Recommendations ===')
        if 'console' in email_backend.lower() and not debug:
            self.stdout.write('1. Set EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend')
        if 'smtp' in email_backend.lower():
            if not email_user or email_user == 'Not set':
                self.stdout.write('1. Set EMAIL_HOST_USER=your-email@gmail.com')
            if not email_password or email_password == 'Not set':
                self.stdout.write('2. Set EMAIL_HOST_PASSWORD=your-app-password (for Gmail)')
            self.stdout.write('3. For Gmail, use an App Password (not your regular password)')
            self.stdout.write('4. Ensure DEFAULT_FROM_EMAIL matches EMAIL_HOST_USER')




