from django.forms import ModelForm
from .models import Sensor, Reagent


class SensorForm(ModelForm):
    class Meta:
        model = Sensor
        fields = '__all__'


class SensorNameAndNotesForm(ModelForm):
    class Meta:
        model = Sensor
        fields = ['name', 'notes']


class ReagentEditForm(ModelForm):
    class Meta:
        model = Reagent
        fields = ['name', 'volume_max', 'is_standard']


class SensorLatLongForm(ModelForm):
    class Meta:
        model = Sensor
        fields = ['lat', 'long']


class SensorSettingsForm(ModelForm):
    class Meta:
        model = Sensor
        fields = [
            'boxcar_width', 'scans_to_average', 'time_to_wait_for_lamp', 'time_between_2_spectrophotometer_scan',
            'flush_flow_rate', 'flush_volume', 'max_flow_rate', 'max_aspirate_volume', 'volume_for_valve_port_priming',
            'time_to_pump'
        ]

        labels = {
            'boxcar_width': 'Boxcar width (number of neighboring pixels used to average each pixel)',
            'time_to_wait_for_lamp': 'Time to wait for lamp to be at full intensity (s)',
            'time_between_2_spectrophotometer_scan': 'Minimum time between 2 spectrophotometer scan (s)',
            'flush_flow_rate': 'Flush flow rate (μL/s)',
            'flush_volume': 'Flush volume (μL)',
            'max_flow_rate': 'Max flow rate (μL/s)',
            'max_aspirate_volume': 'Max aspirate volume (μL)',
            'volume_for_valve_port_priming': 'Volume for valve port priming (μL)',
            'scans_to_average': 'Scans to average (number of scan take for averaging)',
            'time_to_pump': 'Time to pump sample from ocean (s)'
        }

    def clean(self):
        cleaned_data = super().clean()
        fields_to_check = [
            'boxcar_width', 'time_to_wait_for_lamp', 'time_between_2_spectrophotometer_scan',
            'flush_flow_rate', 'flush_volume', 'max_flow_rate', 'max_aspirate_volume', 'volume_for_valve_port_priming'
        ]

        for field in fields_to_check:
            value = cleaned_data.get(field)
            if value is not None and value < 0:
                self.add_error(field, 'This value must be positive or zero.')

        return cleaned_data
