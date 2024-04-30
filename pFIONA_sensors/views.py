from django.contrib.auth.decorators import login_required
from django.shortcuts import render, redirect, get_object_or_404
from .forms import SensorForm, SensorIPForm

from pFIONA_sensors.models import Sensor


@login_required()
def sensors_list(request):
    sensors_list = Sensor.objects.all()
    context = {
        'sensors_list': sensors_list,
        'current_path': request.path,
    }
    return render(request, 'pFIONA_sensors/sensors_list.html', context=context)


@login_required()
def sensors_add(request):
    if request.method == 'POST':
        form = SensorForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('sensors_list')
    else:
        form = SensorForm()
    return render(request, 'pFIONA_sensors/sensors_add.html', {'form': form})


@login_required()
def sensors_manual(request, id):
    return render(request, 'pFIONA_sensors/view/sensors_manual.html', {'id': id})


@login_required()
def sensors_deploy(request, id):
    return render(request, 'pFIONA_sensors/view/sensors_deploy.html', {'id': id})


@login_required()
def sensors_data(request, id):
    return render(request, 'pFIONA_sensors/view/sensors_data.html', {'id': id})


@login_required
def sensors_settings(request, id):
    sensor = get_object_or_404(Sensor, pk=id)
    ip_form = SensorIPForm(request.POST or None, instance=sensor, prefix='ip')

    if request.method == 'POST':
        if 'submit_ip' in request.POST:
            ip_form = SensorIPForm(request.POST, instance=sensor, prefix='ip')
            if ip_form.is_valid():
                ip_form.save()
                return redirect('sensors_settings', id=id)
            else:
                # Afficher les erreurs de validation pour diagnostiquer le problème
                print(ip_form.errors)
    # Ce bloc s'exécute si la requête n'est pas POST ou aucun bouton spécifique n'a été cliqué
    return render(request, 'pFIONA_sensors/view/sensors_settings.html', {'id': id, 'ip_form': ip_form})
