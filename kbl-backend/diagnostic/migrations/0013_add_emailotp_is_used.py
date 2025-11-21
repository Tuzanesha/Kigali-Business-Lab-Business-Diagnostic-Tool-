# Generated manually to add missing is_used field
# This migration is idempotent - it checks if the column exists before adding it

from django.db import migrations, models


def add_is_used_if_not_exists(apps, schema_editor):
    """Add is_used column only if it doesn't exist"""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        # Check if column exists
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='diagnostic_emailotp' AND column_name='is_used'
        """)
        if not cursor.fetchone():
            # Column doesn't exist, add it with default value
            cursor.execute("""
                ALTER TABLE diagnostic_emailotp 
                ADD COLUMN is_used BOOLEAN DEFAULT FALSE
            """)


def reverse_add_is_used(apps, schema_editor):
    """Remove is_used column if it exists"""
    db_alias = schema_editor.connection.alias
    with schema_editor.connection.cursor() as cursor:
        cursor.execute("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='diagnostic_emailotp' AND column_name='is_used'
        """)
        if cursor.fetchone():
            cursor.execute("ALTER TABLE diagnostic_emailotp DROP COLUMN is_used")


class Migration(migrations.Migration):

    dependencies = [
        ('diagnostic', '0012_teammember_invitation_expires_at_and_more'),
    ]

    operations = [
        migrations.RunPython(
            add_is_used_if_not_exists,
            reverse_add_is_used,
        ),
    ]

