import json
from pathlib import Path
from typing import Dict

from django.core.management.base import BaseCommand, CommandError

from diagnostic.models import Category, Question


CATEGORY_ORDER = [
    "LEADERSHIP",
    "ORGANISATION & STAFF",
    "PRODUCT & PROCESSING",
    "SERVICE DEVELOPMENT & DELIVERY",
    "MARKET ANALYSIS & MARKETING",
    "SALES",
    "FINANCIAL PLANNING & MANAGEMENT",
    "LEGAL & IT",
]


class Command(BaseCommand):
    help = "Import categories and questions from assessment_questions.json"

    def add_arguments(self, parser):
        parser.add_argument(
            "--file",
            type=str,
            default=str(Path.cwd() / "assessment_questions.json"),
            help="Path to assessment_questions.json",
        )
        parser.add_argument(
            "--force",
            action='store_true',
            help="Force import even if questions already exist",
        )
        parser.add_argument(
            "--skip-if-exists",
            action='store_true',
            default=True,
            help="Skip import if questions already exist (default: True)",
        )

    def handle(self, *args, **options):
        path = Path(options["file"]).resolve()
        
        # Try multiple possible locations for the file
        if not path.exists():
            # Try relative to project root
            project_root = Path(__file__).parent.parent.parent.parent
            alt_path = project_root / "assessment_questions.json"
            if alt_path.exists():
                path = alt_path
            else:
                # Try current working directory
                cwd_path = Path.cwd() / "assessment_questions.json"
                if cwd_path.exists():
                    path = cwd_path
                else:
                    self.stdout.write(
                        self.style.WARNING(
                            f"File not found: {path}. Tried: {path}, {alt_path}, {cwd_path}. "
                            "Skipping question import. Questions may need to be imported manually."
                        )
                    )
                    return  # Exit gracefully instead of raising error

        try:
            with path.open() as f:
                data = json.load(f)
        except json.JSONDecodeError as e:
            raise CommandError(f"Invalid JSON in file {path}: {e}")
        except Exception as e:
            raise CommandError(f"Error reading file {path}: {e}")

        questions = data.get("questions", [])
        if not questions:
            self.stdout.write(
                self.style.WARNING("No questions found in JSON under key 'questions'. Skipping import.")
            )
            return

        # Check if questions already exist (unless --force is used)
        force = options.get('force', False)
        skip_if_exists = options.get('skip_if_exists', True) and not force
        
        if skip_if_exists:
            existing_count = Question.objects.count()
            if existing_count > 0:
                self.stdout.write(
                    self.style.SUCCESS(
                        f"Questions already exist in database ({existing_count} questions). "
                        "Skipping import. Use --force to reimport."
                    )
                )
                return

        # Ensure categories exist (bulk operation)
        name_to_category: Dict[str, Category] = {}
        categories_to_create = []
        for name in CATEGORY_ORDER:
            try:
                cat = Category.objects.get(name=name)
                name_to_category[name] = cat
            except Category.DoesNotExist:
                categories_to_create.append(Category(name=name, weight=1.00))
        
        if categories_to_create:
            Category.objects.bulk_create(categories_to_create, ignore_conflicts=True)
            # Reload created categories
            for cat in Category.objects.filter(name__in=[c.name for c in categories_to_create]):
                name_to_category[cat.name] = cat

        created = 0
        updated = 0
        
        # Use bulk operations for better performance
        questions_to_create = []
        questions_to_update = []

        for q in questions:
            category_name = q["category_name"].strip()
            if category_name not in name_to_category:
                # Create any new categories not in the canonical list
                cat, _ = Category.objects.get_or_create(name=category_name, defaults={"weight": 1.00})
                name_to_category[category_name] = cat

            cat = name_to_category[category_name]
            number = q["number"].strip()
            
            # Try to get existing question
            try:
                existing = Question.objects.get(category=cat, number=number)
                # Update existing
                existing.priority = int(q.get("priority", 3))
                existing.text = q["text"].strip()
                existing.descriptors = q.get("descriptors", {})
                existing.evidence_prompt = q.get("evidence_prompt", "")
                existing.weight = int(q.get("weight", 4))
                questions_to_update.append(existing)
                updated += 1
            except Question.DoesNotExist:
                # Create new
                questions_to_create.append(Question(
                    category=cat,
                    number=number,
                    priority=int(q.get("priority", 3)),
                    text=q["text"].strip(),
                    descriptors=q.get("descriptors", {}),
                    evidence_prompt=q.get("evidence_prompt", ""),
                    weight=int(q.get("weight", 4)),
                ))
                created += 1

        # Bulk create new questions
        if questions_to_create:
            Question.objects.bulk_create(questions_to_create, ignore_conflicts=True)
        
        # Bulk update existing questions
        if questions_to_update:
            Question.objects.bulk_update(
                questions_to_update,
                ['priority', 'text', 'descriptors', 'evidence_prompt', 'weight'],
                batch_size=100
            )

        self.stdout.write(self.style.SUCCESS(f"Imported questions. Created: {created}, Updated: {updated}"))


