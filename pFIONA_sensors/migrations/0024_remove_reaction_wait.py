# Generated by Django 5.0.4 on 2024-05-16 21:15

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pFIONA_sensors', '0023_alter_reaction_wait'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='reaction',
            name='wait',
        ),
    ]
