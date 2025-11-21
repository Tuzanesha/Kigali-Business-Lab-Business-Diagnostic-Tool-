import json
from django.core.management.base import BaseCommand
from diagnostic.models import Category, Question


class Command(BaseCommand):
    help = 'Import questions from assessment_questions.json'

    def add_arguments(self, parser):
        parser.add_argument(
            '--file',
            type=str,
            default='assessment_questions.json',
            help='Path to the JSON file containing questions'
        )

    def handle(self, *args, **options):
        file_path = options['file']
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                data = json.load(f)
        except FileNotFoundError:
            self.stdout.write(self.style.ERROR(f'File not found: {file_path}'))
            return
        except json.JSONDecodeError as e:
            self.stdout.write(self.style.ERROR(f'Invalid JSON: {e}'))
            return

        questions_data = data.get('questions', [])
        
        if not questions_data:
            self.stdout.write(self.style.WARNING('No questions found in JSON file'))
            return

        created_categories = 0
        created_questions = 0
        updated_questions = 0

        for q_data in questions_data:
            category_name = q_data.get('category_name', '').strip()
            if not category_name:
                self.stdout.write(self.style.WARNING('Skipping question with no category_name'))
                continue

            # Get or create category
            category, cat_created = Category.objects.get_or_create(
                name=category_name,
                defaults={'weight': 1.00}
            )
            if cat_created:
                created_categories += 1

            # Get or create question
            question_number = q_data.get('number', '').strip()
            if not question_number:
                self.stdout.write(self.style.WARNING(f'Skipping question in {category_name} with no number'))
                continue

            question, q_created = Question.objects.get_or_create(
                category=category,
                number=question_number,
                defaults={
                    'priority': q_data.get('priority', 3),
                    'text': q_data.get('text', ''),
                    'descriptors': q_data.get('descriptors', {}),
                    'evidence_prompt': q_data.get('evidence_prompt', ''),
                    'weight': q_data.get('weight', 4),
                }
            )

            if q_created:
                created_questions += 1
            else:
                # Update existing question
                question.priority = q_data.get('priority', question.priority)
                question.text = q_data.get('text', question.text)
                question.descriptors = q_data.get('descriptors', question.descriptors)
                question.evidence_prompt = q_data.get('evidence_prompt', question.evidence_prompt)
                question.weight = q_data.get('weight', question.weight)
                question.save()
                updated_questions += 1

        self.stdout.write(self.style.SUCCESS(
            f'Import complete:\n'
            f'  Categories created: {created_categories}\n'
            f'  Questions created: {created_questions}\n'
            f'  Questions updated: {updated_questions}'
        ))

