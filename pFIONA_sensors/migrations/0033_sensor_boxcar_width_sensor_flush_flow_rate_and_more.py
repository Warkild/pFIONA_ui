# Generated by Django 5.0.6 on 2024-05-23 22:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pFIONA_sensors', '0032_alter_wavelengthmonitored_table'),
    ]

    operations = [
        migrations.AddField(
            model_name='sensor',
            name='boxcar_width',
            field=models.IntegerField(null=True),
        ),
        migrations.AddField(
            model_name='sensor',
            name='flush_flow_rate',
            field=models.IntegerField(null=True),
        ),
        migrations.AddField(
            model_name='sensor',
            name='flush_volume',
            field=models.IntegerField(null=True),
        ),
        migrations.AddField(
            model_name='sensor',
            name='max_aspirate_volume',
            field=models.IntegerField(null=True),
        ),
        migrations.AddField(
            model_name='sensor',
            name='max_flow_rate',
            field=models.IntegerField(null=True),
        ),
        migrations.AddField(
            model_name='sensor',
            name='scans_to_average',
            field=models.IntegerField(null=True),
        ),
        migrations.AddField(
            model_name='sensor',
            name='time_between_2_measure',
            field=models.IntegerField(null=True),
        ),
        migrations.AddField(
            model_name='sensor',
            name='time_to_wait_for_lamp',
            field=models.IntegerField(null=True),
        ),
    ]
