# Generated by Django 5.0.4 on 2024-05-09 23:33

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pFIONA_sensors', '0011_rename_isstandard_reagent_is_standard'),
    ]

    operations = [
        migrations.RenameField(
            model_name='reaction',
            old_name='standard_id',
            new_name='standard',
        ),
        migrations.RenameField(
            model_name='sensor',
            old_name='actual_reaction_id',
            new_name='actual_reaction',
        ),
    ]
