"""
Management command to diagnose and fix common production issues.
Run this in Render Shell to check and fix issues.
"""
from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection
from django.conf import settings
import os
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = "Diagnose and fix common production issues"

    def add_arguments(self, parser):
        parser.add_argument(
            '--fix',
            action='store_true',
            help='Actually fix issues (run migrations, etc.)',
        )

    def handle(self, *args, **options):
        fix = options.get('fix', False)
        issues_found = []
        issues_fixed = []

        self.stdout.write(self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("Production Issues Diagnostic Tool"))
        self.stdout.write(self.style.SUCCESS("=" * 60))

        # 1. Check database connection
        self.stdout.write("\n1. Checking database connection...")
        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
            self.stdout.write(self.style.SUCCESS("   ✓ Database connection OK"))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f"   ✗ Database connection failed: {e}"))
            return

        # 2. Check team_members table
        self.stdout.write("\n2. Checking team_members table...")
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT table_name 
                FROM information_schema.tables 
                WHERE table_schema = 'public' 
                AND table_name = 'team_members'
            """)
            exists = cursor.fetchone()
            if exists:
                self.stdout.write(self.style.SUCCESS("   ✓ team_members table exists"))
            else:
                self.stdout.write(self.style.ERROR("   ✗ team_members table does NOT exist"))
                issues_found.append("team_members table missing")
                if fix:
                    self.stdout.write("   → Running migrations...")
                    try:
                        call_command('migrate', '--noinput', verbosity=1)
                        self.stdout.write(self.style.SUCCESS("   ✓ Migrations completed"))
                        issues_fixed.append("team_members table created")
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"   ✗ Migration failed: {e}"))

        # 3. Check email provider (Resend) configuration
        self.stdout.write("\n3. Checking email (Resend) configuration...")
        resend_key = os.environ.get('RESEND_API_KEY')
        from_email = os.environ.get('DEFAULT_FROM_EMAIL', settings.DEFAULT_FROM_EMAIL)
        
        if resend_key:
            self.stdout.write(self.style.SUCCESS(f"   ✓ RESEND_API_KEY is set (length: {len(resend_key)})"))
        else:
            self.stdout.write(self.style.ERROR("   ✗ RESEND_API_KEY is NOT set"))
            issues_found.append("Resend API key missing")
        
        self.stdout.write(f"   From Email: {from_email}")

        # 4. Check media directory
        self.stdout.write("\n4. Checking media directory...")
        media_root = settings.MEDIA_ROOT
        if os.path.exists(media_root):
            self.stdout.write(self.style.SUCCESS(f"   ✓ Media directory exists: {media_root}"))
            # Check if writable
            if os.access(media_root, os.W_OK):
                self.stdout.write(self.style.SUCCESS("   ✓ Media directory is writable"))
            else:
                self.stdout.write(self.style.WARNING("   ⚠ Media directory is not writable"))
                issues_found.append("Media directory not writable")
        else:
            self.stdout.write(self.style.WARNING(f"   ⚠ Media directory does not exist: {media_root}"))
            issues_found.append("Media directory missing")
            if fix:
                try:
                    os.makedirs(media_root, exist_ok=True)
                    os.makedirs(os.path.join(media_root, 'avatars'), exist_ok=True)
                    self.stdout.write(self.style.SUCCESS("   ✓ Media directory created"))
                    issues_fixed.append("Media directory created")
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"   ✗ Failed to create media directory: {e}"))

        # 5. Check pending migrations
        self.stdout.write("\n5. Checking for pending migrations...")
        try:
            from io import StringIO
            import sys
            old_stdout = sys.stdout
            sys.stdout = buffer = StringIO()
            call_command('showmigrations', '--list', verbosity=0)
            output = buffer.getvalue()
            sys.stdout = old_stdout
            
            pending = [line for line in output.split('\n') if '[ ]' in line]
            if pending:
                self.stdout.write(self.style.WARNING(f"   ⚠ Found {len(pending)} pending migrations"))
                issues_found.append(f"{len(pending)} pending migrations")
                if fix:
                    self.stdout.write("   → Running migrations...")
                    try:
                        call_command('migrate', '--noinput', verbosity=1)
                        self.stdout.write(self.style.SUCCESS("   ✓ Migrations completed"))
                        issues_fixed.append("Pending migrations applied")
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f"   ✗ Migration failed: {e}"))
            else:
                self.stdout.write(self.style.SUCCESS("   ✓ No pending migrations"))
        except Exception as e:
            self.stdout.write(self.style.WARNING(f"   ⚠ Could not check migrations: {e}"))

        # Summary
        self.stdout.write("\n" + self.style.SUCCESS("=" * 60))
        self.stdout.write(self.style.SUCCESS("Summary"))
        self.stdout.write(self.style.SUCCESS("=" * 60))
        
        if issues_found:
            self.stdout.write(self.style.WARNING(f"\nIssues Found: {len(issues_found)}"))
            for issue in issues_found:
                self.stdout.write(f"  - {issue}")
        else:
            self.stdout.write(self.style.SUCCESS("\n✓ No issues found!"))
        
        if issues_fixed:
            self.stdout.write(self.style.SUCCESS(f"\nIssues Fixed: {len(issues_fixed)}"))
            for fix in issues_fixed:
                self.stdout.write(f"  - {fix}")
        
        if issues_found and not fix:
            self.stdout.write(self.style.WARNING("\n💡 Run with --fix to automatically fix issues"))
            self.stdout.write(self.style.WARNING("   Example: python manage.py fix_production_issues --fix"))

