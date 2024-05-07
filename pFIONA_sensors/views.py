import json

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.csrf import csrf_exempt

from .forms import SensorForm, SensorIPForm, SensorNameAndNotesForm, ReagentEditForm
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from pFIONA_auth.serializers import CustomTokenObtainPairSerializer
from django.db.models import Q

from pFIONA_sensors.models import Sensor, Reagent


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
    sensor = get_object_or_404(Sensor, pk=id)

    # JWT Token Loading

    refresh = RefreshToken.for_user(request.user)
    serializer = CustomTokenObtainPairSerializer()
    token = serializer.get_token(request.user)

    access_token = str(token)
    refresh_token = str(refresh)

    return render(request, 'pFIONA_sensors/view/sensors_manual.html',
                  {'id': id, 'ip_address': sensor.ip_address, 'access_token': access_token,
                   'refresh_token': refresh_token})


@login_required()
def sensors_deploy(request, id):
    return render(request, 'pFIONA_sensors/view/sensors_deploy.html', {'id': id})


@login_required()
def sensors_data(request, id):
    return render(request, 'pFIONA_sensors/view/sensors_data.html', {'id': id})


@login_required()
def sensors_reagents(request, id):
    sensor = get_object_or_404(Sensor, pk=id)
    reagents = Reagent.objects.filter(sensor_id=id)

    # JWT Token Loading

    refresh = RefreshToken.for_user(request.user)
    serializer = CustomTokenObtainPairSerializer()
    token = serializer.get_token(request.user)

    access_token = str(token)
    refresh_token = str(refresh)

    reagents_data = [{
        'id': reagent.id,
        'name': reagent.name,
        'volume': reagent.volume,
        'max_volume': reagent.max_volume,
        'port': reagent.port,
        'sensor_id': reagent.sensor_id,
    } for reagent in reagents]

    reagents_json = json.dumps(reagents_data)

    return render(request, 'pFIONA_sensors/view/sensors_reagents.html', {
        'id': id,
        'ip_address': sensor.ip_address,
        'reagents_json': reagents_json,
        'access_token': access_token,
        'refresh_token': refresh_token
    })


@login_required()
@csrf_exempt
def sensors_reagents_valve_update(request, id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))

            print(data)

            Reagent.objects.filter(sensor_id=id).update(port=None)

            for index, reagent_id in enumerate(data):
                if reagent_id != 'none':
                    Reagent.objects.filter(id=int(reagent_id)).update(port=index+1)

            return JsonResponse({'status': 'success', 'message': 'Ports updated successfully'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)


@login_required()
def sensors_reagent_delete(request, id, reagent_id):
    reagent = get_object_or_404(Reagent, pk=reagent_id)
    reagent.delete()
    return redirect('sensors_reagents', id=id)


@login_required()
def sensors_reagent_edit(request, id, reagent_id):
    reagent = get_object_or_404(Reagent, pk=reagent_id)
    reagent_form = ReagentEditForm(request.POST or None, instance=reagent, prefix='reagent')

    if request.method == 'POST':
        print('POST')
        if 'sumbit_reagent' in request.POST:
            print('sumbit reagent')
            reagent_form = ReagentEditForm(request.POST, instance=reagent, prefix='reagent')
            if reagent_form.is_valid():
                reagent_form.save()
                return redirect('sensors_reagents', id=id)
    return render(request, 'pfiONA_sensors/view/sensors_reagent_edit.html', {
        'id': id,
        'reagent_form': reagent_form,
    })


@login_required
def sensors_settings(request, id):
    sensor = get_object_or_404(Sensor, pk=id)
    ip_form = SensorIPForm(request.POST or None, instance=sensor, prefix='ip')
    name_notes_form = SensorNameAndNotesForm(request.POST or None, instance=sensor, prefix='name_notes')

    if request.method == 'POST':
        if 'submit_ip' in request.POST:
            ip_form = SensorIPForm(request.POST, instance=sensor, prefix='ip')
            if ip_form.is_valid():
                ip_form.save()
                return redirect('sensors_settings', id=id)
        if 'sumbit_name_notes' in request.POST:
            ip_form = SensorNameAndNotesForm(request.POST, instance=sensor, prefix='name_notes')
            if ip_form.is_valid():
                ip_form.save()
                return redirect('sensors_settings', id=id)
    # Ce bloc s'exécute si la requête n'est pas POST ou aucun bouton spécifique n'a été cliqué
    return render(request, 'pFIONA_sensors/view/sensors_settings.html',
                  {'id': id, 'ip_form': ip_form, 'name_notes_form': name_notes_form})
