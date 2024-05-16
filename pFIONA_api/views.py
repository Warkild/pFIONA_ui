import json

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

        if int(data['wait_time']) <= -1:
            raise ValidationError('Waiting time cannot be negative')

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
                if step[0] in reagent_id:
                    raise ValidationError("You can't add the same reagent more than once")
                reagent_id.append(step[0])
            else:
                # Nothing selected
                raise ValidationError('Step cannot be empty')

        if data['standard_reagent_id'] == "":
            raise ValidationError('Standard reagent cannot be empty')

        if float(data["standard_concentration"]) <= 0:
            raise ValidationError('Standard concentration cannot be negative')

        # All validations passed, proceed to create the reaction
        reaction = q.create_reaction(data['name'], int(data['wait_time']), int(data['standard_reagent_id']),
                                     float(data['standard_concentration']))

        for key, step in enumerate(data['steps']):
            if step[0] == "w":
                # Wait Time
                q.create_step(None, reaction.id, step[1], key)
            else:
                # Reagent
                q.create_step(step[0], reaction.id, step[1], key)

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

        if data['name'] == "":
            raise ValidationError('Name cannot be empty')

        wait_time = int(data['wait_time'])
        if wait_time <= -1:
            raise ValidationError('Waiting time cannot be negative')

        if len(data['reagents']) == 0:
            raise ValidationError('You need to specify at least one reagent')

        reagent_ids = set()
        for reagent in data['reagents']:
            reagent_id, volume = reagent
            if not reagent_id or volume == "":
                raise ValidationError('All reagents must be specified with non-empty ID and volume')
            volume = int(volume)
            if volume <= 0:
                raise ValidationError('The volume of reagent cannot be negative or null')
            if reagent_id in reagent_ids:
                raise ValidationError("You can't add the same reagent more than once")
            reagent_ids.add(reagent_id)

        if data['standard_reagent_id'] == "":
            raise ValidationError('Standard reagent cannot be empty')

        standard_concentration = float(data["standard_concentration"])
        if standard_concentration <= 0:
            raise ValidationError('Standard concentration cannot be negative')

        reaction = q.update_reaction(data['id'], data['name'], wait_time, int(data['standard_reagent_id']),
                                     standard_concentration)

        q.delete_all_step(data['id'])

        for key, reagent in enumerate(data['reagents']):
            q.create_step(reagent[0], reaction.id, reagent[1], key)

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
