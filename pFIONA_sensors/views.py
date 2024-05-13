import json

from pFIONA_sensors import queries as q

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.tokens import RefreshToken

from pFIONA_auth.serializers import CustomTokenObtainPairSerializer
from pFIONA_sensors.models import Sensor, Reagent, VolumeToAdd, Reaction
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

    # REAGENTS

    reagents = Reagent.objects.filter(pfiona_sensor_id=sensor_id)

    reagents_data = [{
        'id': reagent.id,
        'name': reagent.name,
        'volume': reagent.volume,
        'volume_max': reagent.volume_max,
        'port': reagent.port,
        'sensor_id': reagent.pfiona_sensor_id,
    } for reagent in reagents]

    reagents_json = json.dumps(reagents_data)

    # REACTIONS

    volume_to_adds = VolumeToAdd.objects.filter(pfiona_reagent__in=reagents)
    reactions = Reaction.objects.filter(volumetoadd__in=volume_to_adds).distinct()

    reactions_data = [{
        'id': reaction.id,
        'name': reaction.name,
        'wait': reaction.wait,
    } for reaction in reactions]

    reactions_json = json.dumps(reactions_data)

    # RENDER

    return render(request, 'pFIONA_sensors/view/sensors_reagents.html', {
        'id': sensor_id,
        'ip_address': sensor.ip_address,
        'reagents_json': reagents_json,
        'reactions_json': reactions_json,
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
def sensors_reaction_delete(request, sensor_id, reaction_id):
    reaction = get_object_or_404(Reaction, pk=reaction_id)
    reaction.delete()
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


@login_required()
def sensors_reaction_add(request, sensor_id):
    reagents_json = q.get_utils_reagents(sensor_id, return_json=True)

    return render(request, 'pFIONA_sensors/view/sensors_reaction_add.html', {
        'id': sensor_id,
        'reagents_json': reagents_json,
    })


@login_required()
def sensors_reaction_edit(request, sensor_id, reaction_id):
    reagents_json = q.get_utils_reagents(sensor_id, return_json=True)

    reaction_json = q.get_reaction_details(reaction_id)

    return render(request, 'pFIONA_sensors/view/sensors_reaction_edit.html', {
        'id': sensor_id,
        'reagents_json': reagents_json,
        'reaction_json': reaction_json
    })


@login_required()
@csrf_exempt
def api_add_reaction(request):
    print(request.body)
    data = json.loads(request.body)

    respect_constraint = True

    # Verifying if data are correct

    if data['name'] == "":
        respect_constraint = False

    if int(data['wait_time']) <= -1:
        respect_constraint = False

    for reagent in data['reagents']:
        if reagent[0] == "" or reagent[1] == "":
            respect_constraint = False

    if data['standard_reagent_id'] == "":
        respect_constraint = False

    if respect_constraint:
        reaction = q.create_reaction(data['name'], int(data['wait_time']), int(data['standard_reagent_id']),
                                     float(data['standard_concentration']))

        for key, reagent in enumerate(data['reagents']):
            q.create_volumetoadd(reagent[0], reaction.id, reagent[1], key)

        return JsonResponse({'status': 'success', 'message': f'Reaction added successfully!'})

    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)


@login_required()
@csrf_exempt
def api_edit_reaction(request):
    data = json.loads(request.body)

    respect_constraint = True

    # Verifying if data are correct

    if data['name'] == "":
        respect_constraint = False

    if int(data['wait_time']) <= -1:
        respect_constraint = False

    if data['id'] == "":
        respect_constraint = False

    for reagent in data['reagents']:
        if reagent[0] == "" or reagent[1] == "":
            respect_constraint = False

    if data['standard_reagent_id'] == "":
        respect_constraint = False

    if respect_constraint:
        reaction = q.update_reaction(data['id'], data['name'], int(data['wait_time']), int(data['standard_reagent_id']),
                                     float(data['standard_concentration']))

        q.delete_all_volumetoadd(data['id'])

        for key, reagent in enumerate(data['reagents']):
            q.create_volumetoadd(reagent[0], reaction.id, reagent[1], key)

        return JsonResponse({'status': 'success', 'message': f'Reaction edit successfully!'})

    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)


@login_required()
@csrf_exempt
def api_get_current_reaction_id(request):
    data = json.loads(request.GET.get('sensor_id'))

    respect_constraint = True

    if data == "":
        respect_constraint = False

    if respect_constraint:
        current_reaction_id = q.get_current_reaction_id(data)
        return JsonResponse({'status': 'success', 'reaction_id': current_reaction_id})

    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)


@login_required()
@csrf_exempt
def api_set_current_reaction(request, sensor_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))

            if data['reaction_id'] is not None:
                q.set_current_reaction(sensor_id, data['reaction_id'])
            else:
                q.set_current_reaction(sensor_id, None)

            return JsonResponse({'status': 'success', 'message': 'Current reaction updated successfully'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)
