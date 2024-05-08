from django.db import models


class Reaction(models.Model):
    name = models.CharField(max_length=100)
    wait = models.IntegerField()

    class Meta:
        db_table = 'pfiona_reactions'


class Sensor(models.Model):
    name = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField()
    notes = models.TextField(null=True)
    actual_reaction_id = models.ForeignKey(Reaction, on_delete=models.CASCADE, null=True)

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


class VolumeToAdd(models.Model):
    reaction = models.ForeignKey(Reaction, on_delete=models.CASCADE)
    reagent = models.ForeignKey(Reagent, on_delete=models.CASCADE)
    volume = models.IntegerField()

    class Meta:
        db_table = 'pfiona_volumetoadd'