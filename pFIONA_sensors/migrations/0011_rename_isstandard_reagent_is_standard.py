# Generated by Django 5.0.4 on 2024-05-09 22:12

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pFIONA_sensors', '0010_reagent_isstandard'),
    ]

    operations = [
        migrations.RenameField(
            model_name='reagent',
            old_name='isStandard',
            new_name='is_standard',
        ),
    ]
