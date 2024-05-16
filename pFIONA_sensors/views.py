import csv
import datetime
import json

from django.db import transaction

from pFIONA_sensors import queries as q, models

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.csrf import csrf_exempt
from rest_framework_simplejwt.tokens import RefreshToken

from pFIONA_auth.serializers import CustomTokenObtainPairSerializer
from pFIONA_sensors.models import Sensor, Reagent, Step, Reaction, Spectrum
from .forms import SensorForm, SensorNameAndNotesForm, ReagentEditForm, SensorLatLongForm


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
                      'sensor': sensor,
                  })


@login_required()
def sensors_deploy(request, sensor_id):
    sensor = get_object_or_404(Sensor, pk=sensor_id)
    return render(request, 'pFIONA_sensors/view/sensors_deploy.html', {'id': sensor_id, 'sensor': sensor})


@login_required()
def sensors_data(request, sensor_id):
    sensor = get_object_or_404(Sensor, pk=sensor_id)
    # q.get_last_spectrum_all_type('Phosphate', 1715802907)
    return render(request, 'pFIONA_sensors/view/sensors_data.html',
                  {'id': sensor_id, 'sensor': sensor, 'ip_address': sensor.ip_address, })


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

    volume_to_adds = Step.objects.filter(pfiona_reagent__in=reagents)
    reactions = Reaction.objects.filter(step__in=volume_to_adds).distinct()

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
        'sensor': sensor,
    })


@login_required()
@csrf_exempt
def sensors_reagents_valve_update(request, sensor_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))

            print(data)

            Reagent.objects.filter(pfiona_sensor_id=sensor_id).update(port=None)

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
    reactions = q.get_reactions_associated_reagent(reagent_id)

    return render(request, 'pFIONA_sensors/view/sensors_reagent_delete.html', {
        'sensor_id': sensor_id,
        'reagent': reagent,
        'reactions': reactions,
    })


@login_required()
def sensors_reagent_deletion(request, sensor_id, reagent_id):
    reagent = get_object_or_404(Reagent, pk=reagent_id)

    with transaction.atomic():
        standard_reactions = Reaction.objects.filter(standard_id=reagent_id)
        standard_reaction_ids = set(standard_reactions.values_list('id', flat=True))

        volume_to_adds = Step.objects.filter(pfiona_reagent_id=reagent_id)
        reaction_ids_from_volume_to_add = set(vta.pfiona_reaction_id for vta in volume_to_adds)
        reaction_ids = standard_reaction_ids.union(reaction_ids_from_volume_to_add)

        Sensor.objects.filter(actual_reaction_id__in=reaction_ids).update(actual_reaction=None)

        Reaction.objects.filter(id__in=reaction_ids).delete()

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
        if 'submit_reagent' in request.POST:
            reagent_form = ReagentEditForm(request.POST, instance=reagent, prefix='reagent')
            if reagent_form.is_valid():
                reagent_form.save()
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
            new_reagent.pfiona_sensor_id = sensor_id
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
    lat_long_form = SensorLatLongForm(request.POST or None, instance=sensor, prefix='lat_long')

    if request.method == 'POST':
        print("********************")
        print(f"{request.method}")
        print(f"{request.POST}")
        if 'submit_name_notes' in request.POST:
            name_notes_form = SensorNameAndNotesForm(request.POST, instance=sensor, prefix='name_notes')
            if name_notes_form.is_valid():
                name_notes_form.save()
                return redirect('sensors_settings', sensor_id=sensor_id)
        if 'submit_lat_long' in request.POST:
            lat_long_form = SensorLatLongForm(request.POST, instance=sensor, prefix='lat_long')
            print(lat_long_form.is_valid())
            if lat_long_form.is_valid():
                lat_long_form.save()
                return redirect('sensors_settings', sensor_id=sensor_id)

    return render(request, 'pFIONA_sensors/view/sensors_settings.html',
                  {'id': sensor_id, 'name_notes_form': name_notes_form, 'sensor': sensor,
                   'lat_long_form': lat_long_form})


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
def export_spectra_csv(request):
    start_timestamp_ms = request.GET.get('start')
    end_timestamp_ms = request.GET.get('end')
    sensor_id = request.GET.get('sensor_id')

    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename="spectra.csv"'},
    )
    writer = csv.writer(response)

    if start_timestamp_ms and end_timestamp_ms:
        start_timestamp = int(start_timestamp_ms) // 1000
        end_timestamp = int(end_timestamp_ms) // 1000

        query = Spectrum.objects.filter(
            pfiona_time__timestamp__gte=start_timestamp,
            pfiona_time__timestamp__lte=end_timestamp,
            pfiona_sensor=sensor_id
        ).select_related('pfiona_spectrumtype', 'pfiona_time')
    else:
        query = Spectrum.objects.all().select_related('pfiona_spectrumtype', 'pfiona_time')

    spectra = query
    all_wavelengths = sorted(set(value.wavelength for spectrum in spectra for value in spectrum.value_set.all()))
    header = ['SpectrumType', 'Timestamp (Local Time)'] + [str(wl) for wl in all_wavelengths]
    writer.writerow(header)

    for spectrum in spectra:
        spectrum_type = spectrum.pfiona_spectrumtype.type
        local_datetime = datetime.datetime.fromtimestamp(spectrum.pfiona_time.timestamp).strftime('%m/%d/%Y %H:%M:%S')
        values_dict = {value.wavelength: value.value for value in spectrum.value_set.all()}
        row = [spectrum_type, local_datetime] + [values_dict.get(wl, '') for wl in all_wavelengths]
        writer.writerow(row)

    return response


@login_required
def prepare_export_spectra_csv(request):
    return render(request, "prepare_export.html", {
        'sensor_id': request.GET.get('sensor_id', ''),
        'start': request.GET.get('start', ''),
        'end': request.GET.get('end', '')
    })
