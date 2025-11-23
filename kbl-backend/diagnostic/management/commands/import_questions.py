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

        # Ensure categories exist
        name_to_category: Dict[str, Category] = {}
        for name in CATEGORY_ORDER:
            cat, _ = Category.objects.get_or_create(name=name, defaults={"weight": 1.00})
            name_to_category[name] = cat

        created = 0
        updated = 0

        for q in questions:
            category_name = q["category_name"].strip()
            if category_name not in name_to_category:
                # Create any new categories not in the canonical list
                cat, _ = Category.objects.get_or_create(name=category_name, defaults={"weight": 1.00})
                name_to_category[category_name] = cat

            cat = name_to_category[category_name]
            number = q["number"].strip()
            defaults = {
                "priority": int(q.get("priority", 3)),
                "text": q["text"].strip(),
                "descriptors": q.get("descriptors", {}),
                "evidence_prompt": q.get("evidence_prompt", ""),
                "weight": int(q.get("weight", 4)),
            }
            obj, created_flag = Question.objects.update_or_create(
                category=cat,
                number=number,
                defaults=defaults,
            )
            if created_flag:
                created += 1
            else:
                updated += 1

        self.stdout.write(self.style.SUCCESS(f"Imported questions. Created: {created}, Updated: {updated}"))


