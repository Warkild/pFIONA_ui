import json

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.tokens import RefreshToken

from pFIONA_auth.serializers import CustomTokenObtainPairSerializer
from pFIONA_sensors.models import Sensor, Reagent
from .forms import SensorForm, SensorNameAndNotesForm, ReagentEditForm


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
def sensors_manual(request, sensor_id):
    sensor = get_object_or_404(Sensor, pk=sensor_id)

    return render(request, 'pFIONA_sensors/view/sensors_manual.html',
                  {
                    'id': sensor_id,
                    'ip_address': sensor.ip_address,
                  })


@login_required()
def sensors_deploy(request, sensor_id):
    return render(request, 'pFIONA_sensors/view/sensors_deploy.html', {'id': sensor_id})


@login_required()
def sensors_data(request, sensor_id):
    return render(request, 'pFIONA_sensors/view/sensors_data.html', {'id': sensor_id})


@login_required()
def sensors_reagents(request, sensor_id):
    sensor = get_object_or_404(Sensor, pk=sensor_id)
    reagents = Reagent.objects.filter(sensor_id=sensor_id)

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
        'id': sensor_id,
        'ip_address': sensor.ip_address,
        'reagents_json': reagents_json,
    })


@login_required()
@csrf_exempt
def sensors_reagents_valve_update(request, sensor_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))

            print(data)

            Reagent.objects.filter(sensor_id=sensor_id).update(port=None)

            for index, reagent_id in enumerate(data):
                if reagent_id != 'none':
                    Reagent.objects.filter(id=int(reagent_id)).update(port=index + 1)

            return JsonResponse({'status': 'success', 'message': 'Ports updated successfully'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)


@login_required()
def sensors_reagent_delete(request, sensor_id, reagent_id):
    reagent = get_object_or_404(Reagent, pk=reagent_id)
    reagent.delete()
    return redirect('sensors_reagents', sensor_id=sensor_id)


@login_required()
def sensors_reagent_edit(request, sensor_id, reagent_id):
    reagent = get_object_or_404(Reagent, pk=reagent_id)
    reagent_form = ReagentEditForm(request.POST or None, instance=reagent, prefix='reagent')

    if request.method == 'POST':
        print('POST')
        if 'submit_reagent' in request.POST:
            print('submit reagent')
            reagent_form = ReagentEditForm(request.POST, instance=reagent, prefix='reagent')
            if reagent_form.is_valid():
                reagent_form.save()
                print("****")
                print(sensor_id)
                return redirect('sensors_reagents', sensor_id=sensor_id)
    return render(request, 'pfiONA_sensors/view/sensors_reagent_edit.html', {
        'id': sensor_id,
        'reagent_form': reagent_form,
    })


@login_required()
def sensors_reagent_add(request, sensor_id):
    if request.method == 'POST':
        reagent_form = ReagentEditForm(request.POST, prefix='reagent')
        if reagent_form.is_valid():
            new_reagent = reagent_form.save(commit=False)
            new_reagent.sensor_id = sensor_id
            new_reagent.volume = 0
            new_reagent.save()
            return redirect('sensors_reagents', sensor_id=sensor_id)
    else:
        reagent_form = ReagentEditForm(prefix='reagent')

    return render(request, 'pfiONA_sensors/view/sensors_reagent_add.html', {
        'id': sensor_id,
        'reagent_form': reagent_form,
    })


@login_required
def sensors_settings(request, sensor_id):
    sensor = get_object_or_404(Sensor, pk=sensor_id)
    name_notes_form = SensorNameAndNotesForm(request.POST or None, instance=sensor, prefix='name_notes')

    if request.method == 'POST':
        if 'submit_name_notes' in request.POST:
            name_notes_form = SensorNameAndNotesForm(request.POST, instance=sensor, prefix='name_notes')
            if name_notes_form.is_valid():
                name_notes_form.save()
                return redirect('sensors_settings', id=sensor_id)

    return render(request, 'pFIONA_sensors/view/sensors_settings.html',
                  {'id': sensor_id, 'name_notes_form': name_notes_form, 'sensor': sensor})
