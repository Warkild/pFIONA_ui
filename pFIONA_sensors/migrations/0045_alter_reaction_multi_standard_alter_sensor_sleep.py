# Generated by Django 5.0.4 on 2024-06-17 20:00

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pFIONA_sensors', '0044_rename_actual_reaction_sensor_actual_reactions'),
    ]

    operations = [
        migrations.AlterField(
            model_name='reaction',
            name='multi_standard',
            field=models.IntegerField(default=False),
        ),
        migrations.AlterField(
            model_name='sensor',
            name='sleep',
            field=models.IntegerField(default=False),
        ),
    ]
