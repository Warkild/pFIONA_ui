from django.forms import ModelForm
from .models import Sensor, Reagent


class SensorForm(ModelForm):
    class Meta:
        model = Sensor
        fields = '__all__'


class SensorIPForm(ModelForm):
    class Meta:
        model = Sensor
        fields = ['ip_address']


class SensorNameAndNotesForm(ModelForm):
    class Meta:
        model = Sensor
        fields = ['name', 'notes']


class ReagentEditForm(ModelForm):
    class Meta:
        model = Reagent
        fields = ['name', 'max_volume']
