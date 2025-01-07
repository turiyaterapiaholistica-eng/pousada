from django.db import migrations
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password

def create_superuser(apps, schema_editor):
    User.objects.create_superuser(
        username='myadmin',
        email='myadmin@example.com',
        password='vilhaadmin'
    )

def reverse_func(apps, schema_editor):
    User = apps.get_model("auth", "User")
    User.objects.get(username="admin").delete()

class Migration(migrations.Migration):
    dependencies = [
        ('cozinha', '0011_create_superuser'),  # Update this
    ]

    operations = [
        migrations.RunPython(create_superuser, reverse_func),
    ]