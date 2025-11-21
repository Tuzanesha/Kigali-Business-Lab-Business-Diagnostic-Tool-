from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = 'Manually verify a user\'s email address'

    def add_arguments(self, parser):
        parser.add_argument(
            '--email',
            type=str,
            required=True,
            help='Email address of the user to verify'
        )

    def handle(self, *args, **options):
        email = options['email']

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User not found: {email}'))
            return

        if user.is_active:
            self.stdout.write(self.style.WARNING(
                f'User {email} is already active (verified)'
            ))
        else:
            user.is_active = True
            user.save()
            self.stdout.write(self.style.SUCCESS(
                f'User {email} has been verified and activated'
            ))

        # Also mark all OTPs as used if EmailOTP model exists
        try:
            from diagnostic.models import EmailOTP
            otps = EmailOTP.objects.filter(user=user, is_used=False)
            count = otps.count()
            if count > 0:
                otps.update(is_used=True)
                self.stdout.write(self.style.SUCCESS(
                    f'Marked {count} unused OTP(s) as used'
                ))
        except ImportError:
            pass
