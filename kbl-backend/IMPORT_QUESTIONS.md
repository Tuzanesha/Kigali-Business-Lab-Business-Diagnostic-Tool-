# Importing Questions to Production Database

This guide explains how to import assessment questions from `assessment_questions.json` into your production PostgreSQL database on Render.

## Automatic Import (Recommended)

Questions are automatically imported during deployment. The `render.yaml` configuration includes the import command in the `startCommand`:

```yaml
startCommand: python manage.py migrate --noinput && python manage.py collectstatic --noinput && python manage.py import_questions && gunicorn config.wsgi:application --bind 0.0.0.0:$PORT --workers 3
```

This means:
- ✅ Questions are imported automatically on every deployment
- ✅ The import is idempotent (safe to run multiple times)
- ✅ Uses `update_or_create`, so existing questions are updated, new ones are created

## Manual Import

If you need to manually import questions (e.g., after a database reset), you can use Render's Shell:

### Option 1: Using Render Shell (Recommended)

1. Go to your Render dashboard
2. Navigate to your web service (`kbl-backend`)
3. Click on "Shell" tab
4. Run the import command:

```bash
python manage.py import_questions
```

### Option 2: Using Render CLI

If you have Render CLI installed:

```bash
render shell kbl-backend
python manage.py import_questions
```

### Option 3: Using Custom File Path

If the file is in a different location:

```bash
python manage.py import_questions --file /path/to/assessment_questions.json
```

## Verification

After importing, verify the questions were imported correctly:

```bash
# In Render Shell
python manage.py shell
```

Then in the Django shell:

```python
from diagnostic.models import Category, Question

# Check categories
print(f"Categories: {Category.objects.count()}")
for cat in Category.objects.all():
    print(f"  - {cat.name}: {Question.objects.filter(category=cat).count()} questions")

# Check total questions
print(f"\nTotal questions: {Question.objects.count()}")
```

## Troubleshooting

### File Not Found Error

If you see "File not found" error:
- Ensure `assessment_questions.json` is committed to your git repository
- The file should be in the project root directory
- Check that the file is included in your Docker image (it should be via `COPY . .` in Dockerfile)

### Import Fails Silently

The import command is designed to fail gracefully if the file is not found (to not break deployments). If you see a warning message, check:
1. The file exists in the container
2. The file has valid JSON format
3. The file contains a "questions" key with an array of questions

### Questions Not Updating

The import uses `update_or_create` based on `category` and `number`. If questions aren't updating:
- Check that the `number` field matches exactly (including formatting like "1-1")
- Check that the `category_name` matches an existing category name exactly

## Notes

- The import is **idempotent** - safe to run multiple times
- Existing questions are **updated** if they already exist
- New questions are **created** if they don't exist
- Categories are created automatically if they don't exist
- The import command searches for the file in multiple locations for flexibility


