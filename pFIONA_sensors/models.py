from django.db import models


# Create your models here.
class Sensor(models.Model):
    name = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField()
    notes = models.TextField(null=True)

    class Meta:
        db_table = 'pfiona_sensor'


class Reagent(models.Model):
    name = models.CharField(max_length=100)
    volume = models.IntegerField()
    max_volume = models.IntegerField()
    port = models.IntegerField(null=True)
    sensor = models.ForeignKey(Sensor, on_delete=models.CASCADE)

    class Meta:
        db_table = 'pfiona_reagent'
