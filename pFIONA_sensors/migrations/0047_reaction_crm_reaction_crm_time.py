# Generated by Django 5.0.4 on 2024-06-26 17:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pFIONA_sensors', '0046_alter_reaction_volume_of_mixture_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='reaction',
            name='crm',
            field=models.IntegerField(default=False),
        ),
        migrations.AddField(
            model_name='reaction',
            name='crm_time',
            field=models.IntegerField(default=7),
        ),
    ]
