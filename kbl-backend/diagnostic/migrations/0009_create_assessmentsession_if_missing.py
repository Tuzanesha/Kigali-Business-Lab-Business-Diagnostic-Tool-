# Generated manually to ensure AssessmentSession table exists when 0007 was faked
from django.db import migrations


class Migration(migrations.Migration):
    dependencies = [
        ('diagnostic', '0008_alter_enterprise_owner'),
    ]

    operations = [
        migrations.RunSQL(
            sql=r'''
            CREATE TABLE IF NOT EXISTS "diagnostic_assessmentsession" (
                "id" bigserial PRIMARY KEY,
                "created_at" timestamp with time zone NOT NULL DEFAULT NOW(),
                "updated_at" timestamp with time zone NOT NULL DEFAULT NOW(),
                "overall_percentage" numeric(5,2) NULL,
                "section_scores" jsonb NOT NULL DEFAULT '{}'::jsonb,
                "priorities" jsonb NOT NULL DEFAULT '{}'::jsonb,
                "enterprise_id" bigint NOT NULL REFERENCES "diagnostic_enterprise" ("id") ON DELETE CASCADE
            );
            ''',
            reverse_sql=r'''
            DROP TABLE IF EXISTS "diagnostic_assessmentsession";
            '''
        ),
    ]
