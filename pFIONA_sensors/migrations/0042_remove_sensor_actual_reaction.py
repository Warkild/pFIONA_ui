# Generated by Django 5.0.4 on 2024-06-10 18:35

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pFIONA_sensors', '0041_spectrum_deployment'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='sensor',
            name='actual_reaction',
        ),
    ]
