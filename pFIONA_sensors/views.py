from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect
from .forms import SensorForm
from pFIONA_sensors.models import Sensor


@login_required()
def sensors_list(request):
    sensors_list = Sensor.objects.all()
    context = {
        'sensors_list': sensors_list,
        'current_path': request.path,
    }
    return render(request, 'pFIONA_sensors/list.html', context=context)


def sensors_add(request):
    if request.method == 'POST':
        form = SensorForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('sensors_list')
    else:
        form = SensorForm()
    return render(request, 'pFIONA_sensors/sensor_add.html', {'form': form})
