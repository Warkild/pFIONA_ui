# Generated by Django 5.0.4 on 2024-05-13 21:47

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pFIONA_sensors', '0016_rename_standard_id_reaction_standard_and_more'),
    ]

    operations = [
        migrations.RenameField(
            model_name='reagent',
            old_name='max_volume',
            new_name='volume_max',
        ),
        migrations.RenameField(
            model_name='time',
            old_name='time',
            new_name='timestamp',
        ),
        migrations.AddField(
            model_name='sensor',
            name='lat',
            field=models.FloatField(null=True),
        ),
        migrations.AddField(
            model_name='sensor',
            name='long',
            field=models.FloatField(null=True),
        ),
        migrations.AddField(
            model_name='sensor',
            name='sample_frequency',
            field=models.FloatField(null=True),
        ),
        migrations.AddField(
            model_name='sensor',
            name='sleep',
            field=models.BooleanField(default=False),
        ),
    ]
