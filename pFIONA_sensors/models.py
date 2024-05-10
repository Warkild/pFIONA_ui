from django.db import models


class Sensor(models.Model):
    name = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField()
    notes = models.TextField(null=True)
    actual_reaction = models.ForeignKey('Reaction', on_delete=models.CASCADE, null=True)

    class Meta:
        db_table = 'pfiona_sensor'


class Reagent(models.Model):
    name = models.CharField(max_length=100)
    volume = models.IntegerField()
    max_volume = models.IntegerField()
    port = models.IntegerField(null=True)
    sensor = models.ForeignKey(Sensor, on_delete=models.CASCADE)
    is_standard = models.BooleanField(default=False)

    class Meta:
        db_table = 'pfiona_reagent'


class Reaction(models.Model):
    name = models.CharField(max_length=100)
    wait = models.IntegerField()
    standard = models.ForeignKey(Reagent, on_delete=models.CASCADE, null=True)
    standard_concentration = models.FloatField(default=0)

    class Meta:
        db_table = 'pfiona_reaction'


class VolumeToAdd(models.Model):
    reaction = models.ForeignKey(Reaction, on_delete=models.CASCADE)
    reagent = models.ForeignKey(Reagent, on_delete=models.CASCADE)
    volume = models.IntegerField()
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'pfiona_volumetoadd'
