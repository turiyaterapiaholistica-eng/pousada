from django.db import migrations, models

class Migration(migrations.Migration):

    dependencies = [
        ('cozinha', '0003_fornecedor_estoque_compra_itemcompra_and_more'),  # Altere isso para sua migration mais recente
    ]

    operations = [
        migrations.AddField(
            model_name='compra',
            name='ativa',
            field=models.BooleanField(default=True),
        ),
    ]