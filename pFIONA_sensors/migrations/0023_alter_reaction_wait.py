# Generated by Django 5.0.4 on 2024-05-16 19:09

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pFIONA_sensors', '0022_step_delete_volumetoadd'),
    ]

    operations = [
        migrations.AlterField(
            model_name='reaction',
            name='wait',
            field=models.IntegerField(null=True),
        ),
    ]
