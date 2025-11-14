from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Delete all app data except categories and questions (and their dependencies)."

    def handle(self, *args, **options):
        from diagnostic.models import (
            Enterprise, QuestionResponse, ScoreSummary, Attachment,
            EmailOTP, PhoneOTP, UserProfile
        )

        # Delete in order respecting FKs
        Attachment.objects.all().delete()
        QuestionResponse.objects.all().delete()
        ScoreSummary.objects.all().delete()
        Enterprise.objects.all().delete()
        EmailOTP.objects.all().delete()
        PhoneOTP.objects.all().delete()
        UserProfile.objects.all().delete()

        self.stdout.write(self.style.SUCCESS('Purged data except categories and questions.'))


