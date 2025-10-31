from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from diagnostic.models import EmailOTP
import logging

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Manually verify a user\'s email address for testing'

    def add_arguments(self, parser):
        parser.add_argument('email', type=str, help='Email of the user to verify')

    def handle(self, *args, **options):
        email = options['email'].lower().strip()
        User = get_user_model()
        
        try:
            user = User.objects.get(email__iexact=email)
            self.stdout.write(self.style.SUCCESS(f'Found user: {user.email} (ID: {user.id})'))
            
            # Create a verified OTP for this user
            otp, created = EmailOTP.objects.get_or_create(
                user=user,
                defaults={
                    'code': 'manual-verify',
                    'is_verified': True,
                    'expires_at': timezone.now() + timezone.timedelta(days=365)  # Far future
                }
            )
            
            if not created:
                otp.is_verified = True
                otp.save()
                self.stdout.write(self.style.SUCCESS(f'Updated existing OTP for {user.email}'))
            else:
                self.stdout.write(self.style.SUCCESS(f'Created new OTP for {user.email}'))
                
            self.stdout.write(self.style.SUCCESS(f'Successfully verified email for {user.email}'))
            
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'No user found with email: {email}'))
            return
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
            import traceback
            logger.error(f'Error in verify_user command: {str(e)}\n{traceback.format_exc()}')
            return
