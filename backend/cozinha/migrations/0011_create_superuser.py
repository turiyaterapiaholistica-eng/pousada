from django.db import migrations
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password

def create_superuser(apps, schema_editor):
    User.objects.create_superuser(
        username='myadmin',
        email='myadmin@example.com',
        password='vilhaadmin'
    )

class Migration(migrations.Migration):
    dependencies = [
        ('cozinha', 'previous_migration'),  # Update this
    ]

    operations = [
        migrations.RunPython(create_superuser),
    ]