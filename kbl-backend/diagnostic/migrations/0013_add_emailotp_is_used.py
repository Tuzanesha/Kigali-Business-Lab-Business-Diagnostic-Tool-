# Generated manually to add missing is_used field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('diagnostic', '0012_teammember_invitation_expires_at_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='emailotp',
            name='is_used',
            field=models.BooleanField(default=False),
        ),
    ]

