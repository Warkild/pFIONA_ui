import csv
import datetime
import json
import ast

import pandas as pd
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render, redirect
from django.urls import reverse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

import pFIONA_api.queries as q
from pFIONA_api.analysis.formula import absorbance
from pFIONA_api.analysis.spectrum_finder import *
from pFIONA_api.validation import validate_reaction_data


@login_required()
@csrf_exempt
def api_set_current_reaction(request, sensor_id):
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))
            print(data)
            reaction_ids = data.get('reaction_ids')

            # Assurez-vous que la liste est stockée correctement dans JSONField
            q.set_current_reaction(sensor_id, reaction_ids)

            return JsonResponse({'status': 'success', 'message': 'Current reactions updated successfully'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)


@login_required()
@csrf_exempt
def api_get_current_reaction(request, sensor_id):
    try:
        current_reactions = q.get_current_reaction(sensor_id)
        return JsonResponse(
            {'status': 'success', 'reaction_names': current_reactions if current_reactions else []})

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@login_required()
@csrf_exempt
def api_add_reaction(request):
    try:
        data = json.loads(request.body)
        print(data)

        # Validate data
        validate_reaction_data(data)

        # All validations passed, proceed to create the reaction
        elements = data['monitored_wavelength'].split(';')
        wavelength_monitored = list(set([int(e) for e in elements if e]))

        reaction = q.create_reaction(data['name'],
                                     int(data['standard_reagent_id']),
                                     float(data['standard_concentration']),
                                     float(data['volume_of_mixture']),
                                     float(data['volume_to_push_to_flow_cell']),
                                     int(data['number_of_blank']),
                                     int(data['number_of_sample']),
                                     int(data['number_of_standard']),
                                     bool(data['multi_standard']),
                                     int(data['multi_standard_time']),
                                     int(data['reaction_time'])
                                     )

        for key, step in enumerate(data['steps']):
            if step[0] == "w":
                # Wait Time
                q.create_step(None, reaction.id, step[1], key)
            else:
                # Reagent
                q.create_step(step[0], reaction.id, step[1], key)

        for wavelength in wavelength_monitored:
            q.create_monitored_wavelength(reaction_id=reaction.id, wavelength=wavelength)

        return JsonResponse({'status': 'success', 'message': 'Reaction added successfully!'})

    except ValidationError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e.message)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': f'An unexpected error occurred: {str(e)}'},
                            status=500)


@login_required()
@csrf_exempt
def api_edit_reaction(request):
    try:
        data = json.loads(request.body)
        print(data)

        # Validate data
        validate_reaction_data(data)

        # All validations passed, proceed to update the reaction

        elements = data['monitored_wavelength'].split(';')
        wavelength_monitored = list(set([int(e) for e in elements if e]))

        reaction = q.update_reaction(data['id'],
                                     data['name'],
                                     int(data['standard_reagent_id']),
                                     float(data['standard_concentration']),
                                     float(data['volume_of_mixture']),
                                     float(data['volume_to_push_to_flow_cell']),
                                     int(data['number_of_blank']),
                                     int(data['number_of_sample']),
                                     int(data['number_of_standard']),
                                     bool(data['multi_standard']),
                                     int(data['multi_standard_time']),
                                     int(data['reaction_time'])
                                     )

        q.delete_all_step(data['id'])
        q.delete_all_wavelength_monitored(data['id'])

        for key, step in enumerate(data['steps']):
            if step[0] == "w":
                # Wait Time
                q.create_step(None, reaction.id, step[1], key)
            else:
                # Reagent
                q.create_step(step[0], reaction.id, step[1], key)

        for wavelength in wavelength_monitored:
            q.create_monitored_wavelength(reaction_id=reaction.id, wavelength=wavelength)

        return JsonResponse({'status': 'success', 'message': 'Reaction edited successfully!'})

    except ValidationError as e:
        return JsonResponse({'status': 'error', 'message': str(e.message)}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': 'An unexpected error occurred: ' + str(e.message)},
                            status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_last_spectrum_all_type_view(request):
    # Récupérer les paramètres de la requête
    reaction_name = request.GET.get('reaction_name')
    timestamp = request.GET.get('timestamp', None)

    # Validation des paramètres
    if not reaction_name or not timestamp:
        return JsonResponse({'error': 'Missing required parameters.'}, status=400)

    # Conversion du timestamp en entier
    try:
        timestamp = int(timestamp)
    except ValueError:
        return JsonResponse({'error': 'Invalid timestamp format.'}, status=400)

    # Appel de la fonction pour récupérer les données
    result = q.get_last_spectrum_all_type(reaction_name, timestamp)

    # Renvoyer les données en format JSON
    return JsonResponse(result)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_validity_reaction_to_set_as_current_reaction(request):
    try:
        reaction_id = request.GET.get('reaction_id')
        reaction_name = request.GET.get('reaction_name')
        sensor_id = request.GET.get('sensor_id')

        if not reaction_id and not reaction_name:
            raise ValueError("Missing reaction_id or reaction_name parameter")

        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        if reaction_id:
            reaction_detail = q.get_reaction_details(reaction_id=reaction_id, sensor_id=sensor_id)
        else:
            reaction_detail = q.get_reaction_details(reaction_name=reaction_name, sensor_id=sensor_id)

        if not reaction_detail:
            raise ValueError("Reaction not found")

        reaction_detail_json = json.loads(reaction_detail)

        valid = True

        for action in reaction_detail_json['actions']:
            if action['reagent_id'] is None:
                pass
            else:
                if q.get_reagent(action['reagent_id']).port is None:
                    valid = False

        if q.get_reagent(reaction_detail_json['standard_id']).port is None:
            valid = False

        return JsonResponse({'status': 'success', 'data': valid})

    except ValueError as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': 'An unexpected error occurred: {}'.format(str(e))},
                            status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_is_sleeping(request):
    try:
        sensor_id = request.GET.get('sensor_id')

        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        is_sleeping = q.is_sleeping(sensor_id)

        return JsonResponse({'status': 'success', 'data': is_sleeping})

    except ValueError as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_is_deployed(request):
    try:
        sensor_id = request.GET.get('sensor_id')

        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        is_deployed = q.is_deployed(sensor_id)

        return JsonResponse({'status': 'success', 'data': is_deployed})

    except ValueError as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_sleep(request):
    try:
        sensor_id = request.GET.get('sensor_id')

        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        sleep = q.get_sensor_sleep(sensor_id)

        return JsonResponse({'status': 'success', 'data': sleep})

    except ValueError as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required()
@require_http_methods(['POST'])
@csrf_exempt
def api_set_sensor_general_settings(request):
    try:
        data = json.loads(request.body)

        if 'sensor_id' not in data:
            raise ValueError("Missing sensor_id parameter")
        if 'sleep' not in data:
            raise ValueError("Missing sleep parameter")
        if 'sample_frequency' not in data:
            raise ValueError("Missing sample_frequency parameter")
        if not q.models.Sensor.objects.filter(id=data['sensor_id']).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        q.set_sensor_sleep(data['sensor_id'], data['sleep'])
        q.set_sample_frequency(data['sensor_id'], data['sample_frequency'])

        return JsonResponse({'status': 'success', 'message': 'Settings change successfully!'})

    except ValueError as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': f'An unexpected error occurred: {str(e.message)}'},
                            status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_sample_frequency(request):
    try:
        sensor_id = request.GET.get('sensor_id')

        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        sample_frequency = q.get_sensor_sample_frequency(sensor_id)

        return JsonResponse({'status': 'success', 'data': sample_frequency})

    except ValueError as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_last_states(request):
    try:
        sensor_id = request.GET.get('sensor_id')

        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        last_states = ast.literal_eval(q.get_last_states(sensor_id))

        return JsonResponse({'status': 'success', 'data': last_states})

    except ValueError as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_cycle_count(request):
    try:
        sensor_id = request.GET.get('sensor_id')
        timestamp = request.GET.get('timestamp')

        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        if not timestamp:
            raise ValueError("Missing timestamp parameter")

        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        cycle_count = get_cycle_count(timestamp, sensor_id)
        return JsonResponse({"cycle_count": cycle_count})

    except ValueError as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_absorbance_spectrums_in_cycle(request):
    try:
        sensor_id = request.GET.get('sensor_id')
        timestamp = request.GET.get('timestamp')
        cycle = request.GET.get('cycle')

        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        if not timestamp:
            raise ValueError("Missing timestamp parameter")

        if not cycle:
            raise ValueError("Missing cycle parameter")

        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        absorbance_data, wavelengths, deployment_info = get_absorbance_spectrums_in_cycle(timestamp, sensor_id, cycle)
        return JsonResponse(
            {"absorbance_data": absorbance_data, "wavelengths": wavelengths, "deployment_info": deployment_info})

    except ValueError as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_mean_absorbance_spectrums_in_cycle(request):
    try:
        sensor_id = request.GET.get('sensor_id')
        timestamp = request.GET.get('timestamp')
        cycle = request.GET.get('cycle')

        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        if not timestamp:
            raise ValueError("Missing timestamp parameter")

        if not cycle:
            raise ValueError("Missing cycle parameter")

        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        absorbance_data, wavelengths, deployment_info = get_mean_absorbance_spectrums_in_cycle(timestamp, sensor_id,
                                                                                               cycle)
        return JsonResponse(
            {"absorbance_data": absorbance_data, "wavelengths": wavelengths, "deployment_info": deployment_info})

    except ValueError as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_spectrums_in_cycle(request):
    try:
        sensor_id = request.GET.get('sensor_id')
        timestamp = request.GET.get('timestamp')
        cycle = request.GET.get('cycle')

        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        if not timestamp:
            raise ValueError("Missing timestamp parameter")

        if not cycle:
            raise ValueError("Missing cycle parameter")

        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        absorbance_data, wavelengths, deployment_info = get_spectrums_in_cycle(timestamp, sensor_id, cycle)
        return JsonResponse(
            {"spectrums_data": absorbance_data, "wavelengths": wavelengths, "deployment_info": deployment_info})

    except ValueError as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def test(request):
    try:
        sensor_id = request.GET.get('sensor_id')
        timestamp = request.GET.get('timestamp')

        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        if not timestamp:
            raise ValueError("Missing timestamp parameter")

        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        absorbance_data, deployment_info = get_monitored_wavelength_values_absorbance_substraction(timestamp, sensor_id)
        return JsonResponse(
            {"spectrums_data": absorbance_data, "deployment_info": deployment_info})

    except ValueError as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_spectrum_in_cycle_full_info(request):
    try:
        sensor_id = request.GET.get('sensor_id')
        timestamp = request.GET.get('timestamp')
        cycle = request.GET.get('cycle')

        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        if not timestamp:
            raise ValueError("Missing timestamp parameter")

        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        data, wavelengths, deployment_info = get_spectrums_in_cycle_full_info(timestamp, sensor_id, cycle)
        return JsonResponse(
            {"data": data, "wavelengths": wavelengths, "deployment_info": deployment_info})

    except ValueError as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@login_required
@require_http_methods(["GET"])
@csrf_exempt
def test2(request):
    try:
        sensor_id = request.GET.get('sensor_id')
        timestamp = request.GET.get('timestamp')

        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        if not timestamp:
            raise ValueError("Missing timestamp parameter")

        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        absorbance_data, deployment_info = calculate_concentration_for_deployment(timestamp, sensor_id)
        return JsonResponse(
            {"spectrums_data": absorbance_data, "deployment_info": deployment_info})

    except ValueError as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def get_standard_concentration(request):
    reaction_name = request.GET.get('reaction_name')
    reaction_id = request.GET.get('reaction_id')

    if reaction_id is not None:
        try:
            reaction_id = int(reaction_id)
        except ValueError:
            return JsonResponse({'error': 'Invalid reaction ID format'}, status=400)

    concentration = q.get_standard_concentration(reaction_name=reaction_name, reaction_id=reaction_id)

    if concentration is not None:
        return JsonResponse({'standard_concentration': concentration})
    else:
        return JsonResponse({'error': 'Reaction not found'}, status=404)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def get_lasts_spectrum_cycle_0(request):
    sensor_id = request.GET.get('sensor_id')

    if sensor_id is not None:
        try:
            sensor_id = int(sensor_id)
        except ValueError:
            return JsonResponse({'error': 'Invalid reaction ID format'}, status=400)

    get_last_spectrum_cycle_0 = q.get_3_last_spectrum_cycle_0(sensor_id)

    if get_last_spectrum_cycle_0 is not None:
        return JsonResponse({'standard_concentration': get_last_spectrum_cycle_0})
    else:
        return JsonResponse({'error': 'Reaction not found'}, status=404)


@login_required()
@csrf_exempt
def api_get_current_reagents_from_current_reaction(request, sensor_id):
    try:
        current_reagents = q.get_reagents_for_current_reaction(sensor_id)
        return JsonResponse(
            {'status': 'success', 'reaction_names': current_reagents if current_reagents else []})

    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_concentration_for_deployment(request):
    try:
        sensor_id = request.GET.get('sensor_id')
        timestamp = request.GET.get('timestamp')

        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        if not timestamp:
            raise ValueError("Missing timestamp parameter")

        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        absorbance_data, deployment_info = calculate_concentration_for_deployment(timestamp, sensor_id)
        return JsonResponse(
            {"spectrums_data": absorbance_data, "deployment_info": deployment_info})

    except ValueError as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required()
def export_raw_spectra_csv(request):
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
        ).select_related('pfiona_spectrumtype', 'pfiona_time').order_by('id')
    else:
        query = Spectrum.objects.all().select_related('pfiona_spectrumtype', 'pfiona_time').order_by('id')

    spectra = query
    data = []

    for spectrum in spectra:
        spectrum_type = spectrum.pfiona_spectrumtype.type
        local_datetime = datetime.datetime.fromtimestamp(spectrum.pfiona_time.timestamp).strftime('%m/%d/%Y %H:%M:%S')
        deployment = spectrum.deployment
        cycle = spectrum.cycle
        id = spectrum.id
        for value in spectrum.value_set.all():
            data.append({
                'SpectrumType': spectrum_type,
                'Timestamp': local_datetime,
                'Deployment': deployment,
                'Cycle': cycle,
                'Id': id,
                'Wavelength': value.wavelength,
                'Value': value.value
            })

    df = pd.DataFrame(data)

    # Use pivot_table and fillna efficiently
    pivoted_df = df.pivot_table(index=['SpectrumType', 'Timestamp', 'Deployment', 'Cycle', 'Id'], columns='Wavelength',
                                values='Value', aggfunc='first').fillna('').reset_index()

    # Sort by Id
    pivoted_df = pivoted_df.sort_values(by='Id')

    # Write the header
    writer.writerow(pivoted_df.columns)

    # Write the data
    for row in pivoted_df.itertuples(index=False):
        writer.writerow(row)

    return response


@login_required
def prepare_export_raw_spectra_csv(request):
    return render(request, "prepare_export.html", {
        'sensor_id': request.GET.get('sensor_id', ''),
        'start': request.GET.get('start', ''),
        'end': request.GET.get('end', '')
    })


@login_required
def prepare_export(request):
    data_type = request.GET.get('data_type', 'raw')
    file_format = request.GET.get('file_format', 'csv')

    if data_type == 'raw' and file_format == 'csv':
        url = reverse('prepare_export_raw_spectra_csv')
        params = f'?start={request.GET.get("start")}&end={request.GET.get("end")}&sensor_id={request.GET.get("sensor_id")}'
        return redirect(f'{url}{params}')
    else:
        return HttpResponse("No export available for the selected data type and file format.", status=400)
