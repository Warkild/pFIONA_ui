# Generated by Django 5.0.4 on 2024-05-20 17:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pFIONA_sensors', '0027_reaction_volume_to_push_to_flow_cell'),
    ]

    operations = [
        migrations.AlterField(
            model_name='sensor',
            name='sample_frequency',
            field=models.FloatField(default=60),
        ),
    ]