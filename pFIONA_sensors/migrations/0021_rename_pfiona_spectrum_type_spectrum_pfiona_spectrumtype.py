# Generated by Django 5.0.4 on 2024-05-14 17:30

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pFIONA_sensors', '0020_alter_sensor_notes_alter_volumetoadd_unique_together'),
    ]

    operations = [
        migrations.RenameField(
            model_name='spectrum',
            old_name='pfiona_spectrum_type',
            new_name='pfiona_spectrumtype',
        ),
    ]
