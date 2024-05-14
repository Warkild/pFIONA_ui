import json

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
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
        current_reaction_id = q.get_current_reaction_id(sensor_id)
        return JsonResponse({'status': 'success', 'reaction_id': current_reaction_id})

    except Exception as e:

        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)

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

