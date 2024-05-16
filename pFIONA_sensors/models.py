from django.db import models


class Sensor(models.Model):
    name = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField()
    notes = models.TextField(null=True, blank=True)
    actual_reaction = models.ForeignKey('Reaction', on_delete=models.CASCADE, null=True)
    lat = models.FloatField(null=True)
    long = models.FloatField(null=True)
    sample_frequency = models.FloatField(null=True)
    sleep = models.BooleanField(default=False)
    last_states = models.CharField(max_length=200, null=True)

    class Meta:
        db_table = 'pfiona_sensor'


class Reagent(models.Model):
    name = models.CharField(max_length=100)
    volume = models.IntegerField(null=True)
    volume_max = models.IntegerField(null=True)
    port = models.IntegerField(null=True)
    sensor = models.ForeignKey(Sensor, on_delete=models.CASCADE, name="pfiona_sensor")
    is_standard = models.BooleanField(default=False)

    class Meta:
        db_table = 'pfiona_reagent'


class Reaction(models.Model):
    name = models.CharField(max_length=100)
    standard = models.ForeignKey(Reagent, on_delete=models.CASCADE, null=True, name="standard")
    standard_concentration = models.FloatField(default=0)

    class Meta:
        db_table = 'pfiona_reaction'


class Step(models.Model):
    reaction = models.ForeignKey(Reaction, on_delete=models.CASCADE, name="pfiona_reaction")
    reagent = models.ForeignKey(Reagent, on_delete=models.CASCADE, name="pfiona_reagent", null=True)
    number = models.IntegerField()
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'pfiona_step'
        unique_together = ('pfiona_reaction', 'pfiona_reagent')


class Spectrum(models.Model):
    sensor = models.ForeignKey(Sensor, on_delete=models.CASCADE, name="pfiona_sensor")
    time = models.ForeignKey('Time', on_delete=models.CASCADE, name="pfiona_time")
    spectrumtype = models.ForeignKey('SpectrumType', on_delete=models.CASCADE, name="pfiona_spectrumtype")

    class Meta:
        db_table = 'pfiona_spectrum'


class SpectrumType(models.Model):
    type = models.CharField(max_length=100)

    class Meta:
        db_table = 'pfiona_spectrumtype'


class Time(models.Model):
    timestamp = models.IntegerField()

    class Meta:
        db_table = 'pfiona_time'


class Value(models.Model):
    value = models.FloatField()
    spectrum = models.ForeignKey(Spectrum, on_delete=models.CASCADE, name="pfiona_spectrum")
    wavelength = models.FloatField()

    class Meta:
        db_table = 'pfiona_value'
        unique_together = (('pfiona_spectrum', 'wavelength'),)
