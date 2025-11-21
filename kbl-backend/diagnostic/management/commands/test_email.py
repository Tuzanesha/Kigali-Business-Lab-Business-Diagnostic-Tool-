from django.core.management.base import BaseCommand
from django.core.mail import send_mail
from django.conf import settings
from accounts.models import User


class Command(BaseCommand):
    help = 'Send a test email to verify email configuration'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            help='Email address to send test email to'
        )
        parser.add_argument(
            '--user',
            type=str,
            help='Username or email of user to send test email to'
        )

    def handle(self, *args, **options):
        email = options.get('email')
        username = options.get('user')

        if not email and not username:
            self.stdout.write(self.style.ERROR(
                'Please provide either --email or --user'
            ))
            return

        if username:
            try:
                # Try username first, then email
                try:
                    user = User.objects.get(username=username)
                except User.DoesNotExist:
                    user = User.objects.get(email=username)
                email = user.email
            except User.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'User not found: {username}'))
                return
            except User.MultipleObjectsReturned:
                self.stdout.write(self.style.ERROR(f'Multiple users found: {username}'))
                return

        if not email:
            self.stdout.write(self.style.ERROR('No email address found'))
            return

        # Display email configuration
        self.stdout.write(f'Email Backend: {settings.EMAIL_BACKEND}')
        self.stdout.write(f'Email Host: {settings.EMAIL_HOST}')
        self.stdout.write(f'Email Port: {settings.EMAIL_PORT}')
        self.stdout.write(f'Email Use TLS: {settings.EMAIL_USE_TLS}')
        self.stdout.write(f'From Email: {settings.DEFAULT_FROM_EMAIL}')
        self.stdout.write(f'To Email: {email}')
        self.stdout.write('')

        try:
            subject = 'Test Email from KBL Backend'
            message = f'''
This is a test email from the KBL Business Diagnostic Tool backend.

If you received this email, it means:
- Email backend is configured correctly
- SMTP settings are working
- You can receive notifications

Email Configuration:
- Backend: {settings.EMAIL_BACKEND}
- Host: {settings.EMAIL_HOST}
- Port: {settings.EMAIL_PORT}
- TLS: {settings.EMAIL_USE_TLS}

Best regards,
KBL Backend System
            '''.strip()

            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[email],
                fail_silently=False,
            )

            self.stdout.write(self.style.SUCCESS(
                f'Test email sent successfully to {email}'
            ))
        except Exception as e:
            self.stdout.write(self.style.ERROR(
                f'Failed to send test email: {str(e)}'
            ))
            raise

