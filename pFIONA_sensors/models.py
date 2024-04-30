from django.db import models


# Create your models here.
class Sensor(models.Model):
    name = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField()
    notes = models.TextField(null=True)

    class Meta:
        db_table = 'pfiona_sensor'
