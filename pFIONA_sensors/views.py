from django.contrib.auth.decorators import login_required
from django.shortcuts import render

from pFIONA_sensors.models import Sensor


@login_required()
def sensors_list(request):
    sensors_list = Sensor.objects.all()
    context = {
        'sensors_list': sensors_list,
        'current_path': request.path,
    }
    return render(request, 'pFIONA_sensors/list.html', context=context)


