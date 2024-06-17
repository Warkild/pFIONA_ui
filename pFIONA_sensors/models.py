from django.db import models
from django.db.models import JSONField


class Sensor(models.Model):
    name = models.CharField(max_length=100)
    ip_address = models.GenericIPAddressField()
    notes = models.TextField(null=True, blank=True)
    actual_reactions = JSONField(null=True, blank=True)
    lat = models.FloatField(null=True)
    long = models.FloatField(null=True)
    sample_frequency = models.FloatField(null=False, default=60)
    sleep = models.IntegerField(default=False)
    last_states = models.CharField(max_length=200, null=True)
    scans_to_average = models.IntegerField(null=True)
    boxcar_width = models.IntegerField(null=True)
    time_to_wait_for_lamp = models.FloatField(null=True)
    time_between_2_spectrophotometer_scan = models.FloatField(null=True)
    flush_flow_rate = models.IntegerField(null=True)
    flush_volume = models.IntegerField(null=True)
    max_flow_rate = models.IntegerField(null=True)
    max_aspirate_volume = models.IntegerField(null=True)
    volume_for_valve_port_priming = models.IntegerField(null=True)
    time_to_pump = models.IntegerField(null=True)

    class Meta:
        db_table = 'pfiona_sensor'


class Reagent(models.Model):
    name = models.CharField(max_length=100)
    volume = models.FloatField(null=True)
    volume_max = models.FloatField(null=True)
    port = models.IntegerField(null=True)
    sensor = models.ForeignKey(Sensor, on_delete=models.CASCADE, name="pfiona_sensor")
    is_standard = models.BooleanField(default=False)

    class Meta:
        db_table = 'pfiona_reagent'


class Reaction(models.Model):
    name = models.CharField(max_length=100)
    standard = models.ForeignKey(Reagent, on_delete=models.CASCADE, null=True, name="standard")
    standard_concentration = models.FloatField(default=1)
    volume_of_mixture = models.FloatField(default=0)
    volume_to_push_to_flow_cell = models.FloatField(default=0)
    reaction_time = models.IntegerField(default=30)
    multi_standard = models.IntegerField(default=False)
    multi_standard_time = models.IntegerField(default=360)
    number_of_standard = models.IntegerField(default=2)
    number_of_blank = models.IntegerField(default=2)
    number_of_sample = models.IntegerField(default=2)

    class Meta:
        db_table = 'pfiona_reaction'


class Step(models.Model):
    reaction = models.ForeignKey(Reaction, on_delete=models.CASCADE, name="pfiona_reaction")
    reagent = models.ForeignKey(Reagent, on_delete=models.CASCADE, name="pfiona_reagent", null=True)
    number = models.IntegerField()
    order = models.IntegerField(default=0)

    class Meta:
        db_table = 'pfiona_step'


class Spectrum(models.Model):
    sensor = models.ForeignKey(Sensor, on_delete=models.CASCADE, name="pfiona_sensor")
    time = models.ForeignKey('Time', on_delete=models.CASCADE, name="pfiona_time")
    spectrumtype = models.ForeignKey('SpectrumType', on_delete=models.CASCADE, name="pfiona_spectrumtype")
    cycle = models.IntegerField(null=True)
    deployment = models.IntegerField(null=True)

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


class WavelengthMonitored(models.Model):
    reaction = models.ForeignKey(Reaction, on_delete=models.CASCADE, name="pfiona_reaction")
    wavelength = models.FloatField()

    class Meta:
        db_table = 'pfiona_wavelengthmonitored'
