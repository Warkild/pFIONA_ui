# Generated by Django 5.0.4 on 2024-07-02 23:14

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pFIONA_sensors', '0047_reaction_crm_reaction_crm_time'),
    ]

    operations = [
        migrations.AlterField(
            model_name='sensor',
            name='last_states',
            field=models.CharField(default='[]', max_length=200, null=True),
        ),
        migrations.AlterField(
            model_name='sensor',
            name='name',
            field=models.CharField(default='New Sensor', max_length=100),
        ),
    ]