import json
import re
import ast

from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

import pFIONA_sensors.queries as q


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


@login_required()
@csrf_exempt
def api_get_current_reaction(request, sensor_id):
    try:
        current_reaction = q.get_current_reaction(sensor_id)
        return JsonResponse(
            {'status': 'success', 'reaction_id': current_reaction.id, 'reaction_name': current_reaction.name})

    except Exception as e:

        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@login_required()
@csrf_exempt
def api_add_reaction(request):
    try:
        data = json.loads(request.body)
        print(data)

        # Validation of data
        if data['name'] == "":
            raise ValidationError('Name cannot be empty')

        if len(data['steps']) == 0:
            raise ValidationError('You need to specify at least one reagent')

        reagent_id = []
        for step in data["steps"]:
            # Receive the step to format ["reagent_id/wait, volume/wait_time"]
            if step[0] == "w":
                # Wait time
                if step[1] == "":
                    raise ValidationError('Wait time cannot be empty')
                if int(step[1]) < 0:
                    raise ValidationError('Wait time cannot be negative')
            elif step[0] != "":
                # Reagent
                if step[1] == "":
                    raise ValidationError('Reagent volume cannot be empty')
                if int(step[1]) <= 0:
                    raise ValidationError('Reagent volume cannot be negative or nul')
                reagent_id.append(step[0])
            else:
                # Nothing selected
                raise ValidationError('Step cannot be empty')

        if len(reagent_id) == 0:
            raise ValidationError('You must specify at least one reagent')

        if data['standard_reagent_id'] == "":
            raise ValidationError('Standard reagent cannot be empty')

        if float(data["standard_concentration"]) <= 0:
            raise ValidationError('Standard concentration cannot be negative')

        if float(data["volume_of_mixture"]) <= 0:
            raise ValidationError('Volume of mixture cannot be negative')

        if float(data["volume_to_push_to_flow_cell"]) <= 0:
            raise ValidationError('Volume of flow cell cannot be negative')

        if float(data["volume_of_mixture"]) < float(data["volume_to_push_to_flow_cell"]):
            raise ValidationError('Volume of mixture must be greater than volume of flow cell')

        if data['monitored_wavelength'] == "":
            raise ValidationError('Monitored wavelength cannot be empty')

        if not bool(re.compile(r'^[0-9;]*$').match(data['monitored_wavelength'])):
            raise ValidationError('Unknown monitored wavelength format')

        # All validations passed, proceed to create the reaction

        elements = data['monitored_wavelength'].split(';')
        wavelength_monitored = list(set([int(e) for e in elements if e]))

        reaction = q.create_reaction(data['name'], int(data['standard_reagent_id']),
                                     float(data['standard_concentration']), float(data['volume_of_mixture']),
                                     float(data['volume_to_push_to_flow_cell']))

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
        return JsonResponse({'status': 'error', 'message': f'An unexpected error occurred: {str(e.message)}'},
                            status=500)


@login_required()
@csrf_exempt
def api_edit_reaction(request):
    try:
        data = json.loads(request.body)
        print(data)

        # Validation of data
        if data['name'] == "":
            raise ValidationError('Name cannot be empty')

        if len(data['steps']) == 0:
            raise ValidationError('You need to specify at least one reagent')

        reagent_id = []
        for step in data["steps"]:
            # Receive the step to format ["reagent_id/wait, volume/wait_time"]
            if step[0] == "w":
                # Wait time
                if step[1] == "":
                    raise ValidationError('Wait time cannot be empty')
                if int(step[1]) < 0:
                    raise ValidationError('Wait time cannot be negative')
            elif step[0] != "":
                # Reagent
                if step[1] == "":
                    raise ValidationError('Reagent volume cannot be empty')
                if int(step[1]) <= 0:
                    raise ValidationError('Reagent volume cannot be negative or nul')
                reagent_id.append(step[0])
            else:
                # Nothing selected
                raise ValidationError('Step cannot be empty')

        if len(reagent_id) == 0:
            raise ValidationError('You must specify at least one reagent')

        if data['standard_reagent_id'] == "":
            raise ValidationError('Standard reagent cannot be empty')

        if float(data["standard_concentration"]) <= 0:
            raise ValidationError('Standard concentration cannot be negative')

        if float(data["volume_of_mixture"]) <= 0:
            raise ValidationError('Volume of mixture cannot be negative')

        if float(data["volume_to_push_to_flow_cell"]) <= 0:
            raise ValidationError('Volume of flow cell cannot be negative')

        if float(data["volume_of_mixture"]) < float(data["volume_to_push_to_flow_cell"]):
            raise ValidationError('Volume of mixture must be greater than volume of flow cell')

        if data['monitored_wavelength'] == "":
            raise ValidationError('Monitored wavelength cannot be empty')

        if not bool(re.compile(r'^[0-9;]*$').match(data['monitored_wavelength'])):
            raise ValidationError('Unknown monitored wavelength format')

        # All validations passed, proceed to update the reaction

        elements = data['monitored_wavelength'].split(';')
        wavelength_monitored = list(set([int(e) for e in elements if e]))

        reaction = q.update_reaction(data['id'], data['name'], int(data['standard_reagent_id']),
                                     float(data['standard_concentration']), float(data['volume_of_mixture']),
                                     float(data['volume_to_push_to_flow_cell']))

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

        if not reaction_id:
            raise ValueError("Missing reaction_id parameter")

        reaction_detail = q.get_reaction_details(reaction_id)

        reaction_detail_json = json.loads(reaction_detail)

        if not reaction_detail:
            raise ValueError("Reaction not found")

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
