from django.core.management.base import BaseCommand
from django.db import transaction
from diagnostic.models import (
    QuestionResponse, ScoreSummary, Enterprise, ActionItem,
    TeamMember, Attachment
)


class Command(BaseCommand):
    help = 'Purge all non-question data (responses, summaries, enterprises, etc.)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--confirm',
            action='store_true',
            help='Confirm deletion (required to actually delete)'
        )

    def handle(self, *args, **options):
        if not options['confirm']:
            self.stdout.write(self.style.WARNING(
                'This will delete ALL non-question data:\n'
                '  - All QuestionResponse records\n'
                '  - All ScoreSummary records\n'
                '  - All Enterprise records\n'
                '  - All ActionItem records\n'
                '  - All TeamMember records\n'
                '  - All Attachment records\n'
                '\n'
                'Run with --confirm to proceed.'
            ))
            return

        with transaction.atomic():
            # Count records before deletion
            response_count = QuestionResponse.objects.count()
            summary_count = ScoreSummary.objects.count()
            enterprise_count = Enterprise.objects.count()
            action_count = ActionItem.objects.count()
            team_count = TeamMember.objects.count()
            attachment_count = Attachment.objects.count()

            # Delete in order (respecting foreign keys)
            self.stdout.write('Deleting QuestionResponse records...')
            QuestionResponse.objects.all().delete()

            self.stdout.write('Deleting ScoreSummary records...')
            ScoreSummary.objects.all().delete()

            self.stdout.write('Deleting ActionItem records...')
            ActionItem.objects.all().delete()

            self.stdout.write('Deleting TeamMember records...')
            TeamMember.objects.all().delete()

            self.stdout.write('Deleting Attachment records...')
            Attachment.objects.all().delete()

            self.stdout.write('Deleting Enterprise records...')
            Enterprise.objects.all().delete()

            self.stdout.write(self.style.SUCCESS(
                f'Purge complete:\n'
                f'  QuestionResponse: {response_count} deleted\n'
                f'  ScoreSummary: {summary_count} deleted\n'
                f'  Enterprise: {enterprise_count} deleted\n'
                f'  ActionItem: {action_count} deleted\n'
                f'  TeamMember: {team_count} deleted\n'
                f'  Attachment: {attachment_count} deleted'
            ))

