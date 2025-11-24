"""
Management command to run migrations and check database status.
Useful for production deployments to ensure all migrations are applied.
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection
from django.apps import apps


class Command(BaseCommand):
    help = "Run migrations and verify database schema"

    def add_arguments(self, parser):
        parser.add_argument(
            '--check-only',
            action='store_true',
            help='Only check migration status without applying',
        )

    def handle(self, *args, **options):
        check_only = options.get('check_only', False)
        
        self.stdout.write("Checking database connection...")
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            self.stdout.write(self.style.SUCCESS("✓ Database connection successful"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"✗ Database connection failed: {e}"))
            return

        # Check for pending migrations
        self.stdout.write("\nChecking for pending migrations...")
        try:
            call_command('showmigrations', '--list', verbosity=0)
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"Could not check migrations: {e}"))

        if not check_only:
            self.stdout.write("\nRunning migrations...")
            try:
                call_command('migrate', '--noinput', verbosity=1)
                self.stdout.write(self.style.SUCCESS("✓ Migrations completed"))
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"✗ Migration failed: {e}"))
                return

        # Check if team_members table exists
        self.stdout.write("\nVerifying database tables...")
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'team_members'
            """)
            exists = cursor.fetchone()
            if exists:
                self.stdout.write(self.style.SUCCESS("✓ team_members table exists"))
            else:
                self.stdout.write(self.style.ERROR("✗ team_members table does not exist"))
                if not check_only:
                    self.stdout.write(self.style.WARNING("Run migrations to create the table"))

        # Check other important tables
        important_tables = ['diagnostic_enterprise', 'diagnostic_question', 'accounts_user']
        for table in important_tables:
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = %s
                """, [table])
                exists = cursor.fetchone()
                if exists:
                    self.stdout.write(self.style.SUCCESS(f"✓ {table} table exists"))
                else:
                    self.stdout.write(self.style.WARNING(f"⚠ {table} table not found"))

        self.stdout.write("\n" + self.style.SUCCESS("Database check complete!"))

