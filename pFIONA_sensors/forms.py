from django.forms import ModelForm
from .models import Sensor


class SensorForm(ModelForm):
    class Meta:
        model = Sensor
        fields = '__all__'


class SensorIPForm(ModelForm):
    class Meta:
        model = Sensor
        fields = ['ip_address']