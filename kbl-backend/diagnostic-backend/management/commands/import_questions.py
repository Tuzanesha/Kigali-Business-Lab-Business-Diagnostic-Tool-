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
        if not path.exists():
            raise CommandError(f"File not found: {path}")

        with path.open() as f:
            data = json.load(f)

        questions = data.get("questions", [])
        if not questions:
            raise CommandError("No questions found in JSON under key 'questions'")

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


