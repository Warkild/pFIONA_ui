# Generated by Django 5.0.6 on 2024-05-24 19:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pFIONA_sensors', '0033_sensor_boxcar_width_sensor_flush_flow_rate_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='sensor',
            name='volume_for_valve_port_priming',
            field=models.IntegerField(null=True),
        ),
    ]