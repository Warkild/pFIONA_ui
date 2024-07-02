import ast
import json

from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

import pFIONA_api.queries as q
from pFIONA_api.analysis.export_csv import export_raw_data, export_absorbance_data, export_concentration_data
from pFIONA_api.analysis.spectrum_finder import *
from pFIONA_api.validation import validate_reaction_data
from pFIONA_sensors.decorators import admin_required
from pFIONA_sensors.models import Sensor


@login_required()
@csrf_exempt
@admin_required
def api_set_current_reaction(request):
    """
    API endpoint to set the current reactions for a sensor.

    :param request: HTTP request object
    :return: JsonResponse indicating success or failure
    """
    if request.method == 'POST':
        try:
            # Parse the JSON body of the request
            data = json.loads(request.body.decode('utf-8'))
            print(data)
            # Extract reaction_ids and sensor_id from the parsed data
            reaction_ids = data.get('reaction_ids')
            sensor_id = data.get('sensor_id')

            # Ensure that the reaction_ids list is stored correctly in the JSONField
            q.set_current_reaction(sensor_id, reaction_ids)

            return JsonResponse({'status': 'success', 'message': 'Current reactions updated successfully'})
        except Exception as e:
            # Return an error response if an exception occurs
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    else:
        # Return an error response for invalid request methods
        return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)


@login_required()
@csrf_exempt
def api_get_current_reaction(request):
    """
    API endpoint to get the current reactions for a sensor.

    :param request: HTTP request object
    :return: JsonResponse indicating success or failure
    """
    try:
        # Retrieve sensor_id from the GET parameters
        sensor_id = request.GET.get('sensor_id')

        # Check if sensor_id parameter is provided
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        # Check if the sensor exists in the database
        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Get the current reactions for the sensor
        current_reactions = q.get_current_reaction(sensor_id)

        # Return a success response with the current reaction names
        return JsonResponse(
            {'status': 'success', 'reaction_names': current_reactions if current_reactions else []}
        )

    except Exception as e:
        # Return an error response if an exception occurs
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@login_required()
@csrf_exempt
@admin_required
def api_add_reaction(request):
    """
    API endpoint to add a new reaction.

    :param request: HTTP request object
    :return: JsonResponse indicating success or failure
    """
    try:
        # Parse the JSON body of the request
        data = json.loads(request.body)
        print(data)

        # Validate the data
        validate_reaction_data(data)

        # Parse monitored wavelengths
        elements = data['monitored_wavelength'].split(';')
        wavelength_monitored = list(set([int(e) for e in elements if e]))

        # Create the reaction
        reaction = q.create_reaction(
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
            int(data['reaction_time']),
            bool(data['crm']),
            int(data['crm_time'])
        )

        # Create the steps
        for key, step in enumerate(data['steps']):
            if step[0] == "w":
                # Wait Time
                q.create_step(None, reaction.id, step[1], key)
            else:
                # Reagent
                q.create_step(step[0], reaction.id, step[1], key)

        # Create monitored wavelengths
        for wavelength in wavelength_monitored:
            q.create_monitored_wavelength(reaction_id=reaction.id, wavelength=wavelength)

        return JsonResponse({'status': 'success', 'message': 'Reaction added successfully!'})

    except ValidationError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e.message)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': f'An unexpected error occurred: {str(e)}'}, status=500)


@login_required()
@csrf_exempt
@admin_required
def api_edit_reaction(request):
    """
    API endpoint to edit an existing reaction.

    :param request: HTTP request object
    :return: JsonResponse indicating success or failure
    """
    try:
        # Parse the JSON body of the request
        data = json.loads(request.body)
        print(data)

        # Validate the data
        validate_reaction_data(data)

        # Parse monitored wavelengths
        elements = data['monitored_wavelength'].split(';')
        wavelength_monitored = list(set([int(e) for e in elements if e]))

        # Update the reaction
        reaction = q.update_reaction(
            data['id'],
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
            int(data['reaction_time']),
            bool(data['crm']),
            int(data['crm_time'])
        )

        # Delete existing steps and monitored wavelengths for the reaction
        q.delete_all_step(data['id'])
        q.delete_all_wavelength_monitored(data['id'])

        # Create the steps
        for key, step in enumerate(data['steps']):
            if step[0] == "w":
                # Wait Time
                q.create_step(None, reaction.id, step[1], key)
            else:
                # Reagent
                q.create_step(step[0], reaction.id, step[1], key)

        # Create monitored wavelengths
        for wavelength in wavelength_monitored:
            q.create_monitored_wavelength(reaction_id=reaction.id, wavelength=wavelength)

        return JsonResponse({'status': 'success', 'message': 'Reaction edited successfully!'})

    except ValidationError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e.message)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': 'An unexpected error occurred: ' + str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_validity_reaction_to_set_as_current_reaction(request):
    """
    API endpoint to check the validity of a reaction to be set as the current reaction.

    :param request: HTTP request object
    :return: JsonResponse indicating if the reaction is valid to be set as current
    """
    try:
        # Retrieve parameters from the GET request
        reaction_id = request.GET.get('reaction_id')
        reaction_name = request.GET.get('reaction_name')
        sensor_id = request.GET.get('sensor_id')

        # Validate the presence of required parameters
        if not reaction_id and not reaction_name:
            raise ValueError("Missing reaction_id or reaction_name parameter")
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        # Retrieve reaction details based on provided parameters
        if reaction_id:
            reaction_detail = q.get_reaction_details(reaction_id=reaction_id, sensor_id=sensor_id)
        else:
            reaction_detail = q.get_reaction_details(reaction_name=reaction_name, sensor_id=sensor_id)

        # Check if the reaction details were found
        if not reaction_detail:
            raise ValueError("Reaction not found")

        # Parse the reaction details JSON
        reaction_detail_json = json.loads(reaction_detail)

        valid = True

        # Check the validity of each action's reagent port
        for action in reaction_detail_json['actions']:
            if action['reagent_id'] is not None:
                if q.get_reagent(action['reagent_id']).port is None:
                    valid = False

        # Check the validity of the standard reagent port
        if q.get_reagent(reaction_detail_json['standard_id']).port is None:
            valid = False

        return JsonResponse({'status': 'success', 'data': valid})

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': 'An unexpected error occurred: {}'.format(str(e))}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_is_sleeping(request):
    """
    API endpoint to check if a sensor is in sleeping state.

    :param request: HTTP request object
    :return: JsonResponse indicating if the sensor is sleeping
    """
    try:
        # Retrieve sensor_id from the GET parameters
        sensor_id = request.GET.get('sensor_id')

        # Validate the presence of the sensor_id parameter
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        # Check if the sensor exists in the database
        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Check if the sensor is in the sleeping state
        is_sleeping = q.is_sleeping(sensor_id)

        return JsonResponse({'status': 'success', 'data': is_sleeping})

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_is_deployed(request):
    """
    API endpoint to check if a sensor is deployed.

    :param request: HTTP request object
    :return: JsonResponse indicating if the sensor is deployed
    """
    try:
        # Retrieve sensor_id from the GET parameters
        sensor_id = request.GET.get('sensor_id')

        # Validate the presence of the sensor_id parameter
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        # Check if the sensor exists in the database
        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Check if the sensor is deployed
        is_deployed = q.is_deployed(sensor_id)

        return JsonResponse({'status': 'success', 'data': is_deployed})

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_is_stop_deploying_in_progress(request):
    """
    API endpoint to check if a sensor is in the process of stopping deployment.

    :param request: HTTP request object
    :return: JsonResponse indicating if the sensor is stopping deployment
    """
    try:
        # Retrieve sensor_id from the GET parameters
        sensor_id = request.GET.get('sensor_id')

        # Validate the presence of the sensor_id parameter
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        # Check if the sensor exists in the database
        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Check if the sensor is in the process of stopping deployment
        is_stop_deploying_in_progress = q.is_stop_deploying_in_progress(sensor_id)

        return JsonResponse({'status': 'success', 'data': is_stop_deploying_in_progress})

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_sleep(request):
    """
    API endpoint to get the sleep state of a sensor.

    :param request: HTTP request object
    :return: JsonResponse indicating the sleep state of the sensor
    """
    try:
        # Retrieve sensor_id from the GET parameters
        sensor_id = request.GET.get('sensor_id')

        # Validate the presence of the sensor_id parameter
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        # Check if the sensor exists in the database
        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Get the sleep state of the sensor
        sleep = q.get_sensor_sleep(sensor_id)

        return JsonResponse({'status': 'success', 'data': sleep})

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

@login_required()
@require_http_methods(['POST'])
@csrf_exempt
@admin_required
def api_set_sensor_general_settings(request):
    """
    API endpoint to set general settings for a sensor, including sleep state and sample frequency.

    :param request: HTTP request object
    :return: JsonResponse indicating success or failure
    """
    try:
        # Parse the JSON body of the request
        data = json.loads(request.body)

        # Validate the presence of required parameters
        if 'sensor_id' not in data:
            raise ValueError("Missing sensor_id parameter")
        if 'sleep' not in data:
            raise ValueError("Missing sleep parameter")
        if 'sample_frequency' not in data:
            raise ValueError("Missing sample_frequency parameter")

        # Check if the sensor exists in the database
        if not q.models.Sensor.objects.filter(id=data['sensor_id']).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Set the sleep state and sample frequency for the sensor
        q.set_sensor_sleep(data['sensor_id'], data['sleep'])
        q.set_sample_frequency(data['sensor_id'], data['sample_frequency'])

        return JsonResponse({'status': 'success', 'message': 'Settings changed successfully!'})

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': f'An unexpected error occurred: {str(e)}'}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_sample_frequency(request):
    """
    API endpoint to get the sample frequency of a sensor.

    :param request: HTTP request object
    :return: JsonResponse indicating the sample frequency of the sensor
    """
    try:
        # Retrieve sensor_id from the GET parameters
        sensor_id = request.GET.get('sensor_id')

        # Validate the presence of the sensor_id parameter
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        # Check if the sensor exists in the database
        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Get the sample frequency of the sensor
        sample_frequency = q.get_sensor_sample_frequency(sensor_id)

        return JsonResponse({'status': 'success', 'data': sample_frequency})

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_active_ports_names(request):
    """
    API endpoint to get the names of reagents with active ports for a given sensor.

    :param request: HTTP request object
    :return: JsonResponse indicating the active ports' names of the sensor
    """
    try:
        # Retrieve sensor_id from the GET parameters
        sensor_id = request.GET.get('sensor_id')

        # Validate the presence of the sensor_id parameter
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        # Check if the sensor exists in the database
        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Get the names of active ports for the sensor
        active_ports_names = q.get_active_ports_names(sensor_id)

        return JsonResponse({'status': 'success', 'data': active_ports_names})

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_last_states(request):
    """
    API endpoint to get the last states of a sensor.

    :param request: HTTP request object
    :return: JsonResponse indicating the last states of the sensor
    """
    try:
        # Retrieve sensor_id from the GET parameters
        sensor_id = request.GET.get('sensor_id')

        # Validate the presence of the sensor_id parameter
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        # Check if the sensor exists in the database
        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Get the last states of the sensor and safely evaluate the string to a Python object
        last_states = ast.literal_eval(q.get_last_states(sensor_id))

        return JsonResponse({'status': 'success', 'data': last_states})

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_cycle_count(request):
    """
    API endpoint to get the cycle count of a sensor at a specific timestamp.

    :param request: HTTP request object
    :return: JsonResponse indicating the cycle count of the sensor
    """
    try:
        # Retrieve sensor_id and timestamp from the GET parameters
        sensor_id = request.GET.get('sensor_id')
        timestamp = request.GET.get('timestamp')

        # Validate the presence of the sensor_id and timestamp parameters
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")
        if not timestamp:
            raise ValueError("Missing timestamp parameter")

        # Check if the sensor exists in the database
        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Get the cycle count for the given timestamp and sensor_id
        cycle_count = get_cycle_count(timestamp, sensor_id)

        return JsonResponse({"cycle_count": cycle_count})

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_absorbance_spectrums_in_cycle(request):
    """
    API endpoint to get absorbance spectrums in a specific cycle for a sensor.

    :param request: HTTP request object
    :return: JsonResponse indicating the absorbance data, wavelengths, and deployment info
    """
    try:
        # Retrieve sensor_id, timestamp, and cycle from the GET parameters
        sensor_id = request.GET.get('sensor_id')
        timestamp = request.GET.get('timestamp')
        cycle = request.GET.get('cycle')

        # Validate the presence of the sensor_id, timestamp, and cycle parameters
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")
        if not timestamp:
            raise ValueError("Missing timestamp parameter")
        if not cycle:
            raise ValueError("Missing cycle parameter")

        # Check if the sensor exists in the database
        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Get the absorbance data, wavelengths, and deployment info for the given parameters
        absorbance_data, wavelengths, deployment_info = get_absorbance_spectrums_in_cycle(timestamp, sensor_id, cycle)

        # Return the response with absorbance data, wavelengths, and deployment info
        return JsonResponse({
            "absorbance_data": absorbance_data,
            "wavelengths": wavelengths,
            "deployment_info": deployment_info
        })

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_mean_absorbance_spectrums_in_cycle(request):
    """
    API endpoint to get the mean absorbance spectrums in a specific cycle for a sensor.

    :param request: HTTP request object
    :return: JsonResponse indicating the mean absorbance data, wavelengths, and deployment info
    """
    try:
        # Retrieve sensor_id, timestamp, and cycle from the GET parameters
        sensor_id = request.GET.get('sensor_id')
        timestamp = request.GET.get('timestamp')
        cycle = request.GET.get('cycle')

        # Validate the presence of the sensor_id, timestamp, and cycle parameters
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")
        if not timestamp:
            raise ValueError("Missing timestamp parameter")
        if not cycle:
            raise ValueError("Missing cycle parameter")

        # Check if the sensor exists in the database
        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Get the mean absorbance data, wavelengths, and deployment info for the given parameters
        absorbance_data, wavelengths, deployment_info = get_mean_absorbance_spectrums_in_cycle(timestamp, sensor_id, cycle)

        # Return the response with mean absorbance data, wavelengths, and deployment info
        return JsonResponse({
            "absorbance_data": absorbance_data,
            "wavelengths": wavelengths,
            "deployment_info": deployment_info
        })

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_spectrum_in_cycle_full_info(request):
    """
    API endpoint to get full spectrum information in a specific cycle for a sensor.

    :param request: HTTP request object
    :return: JsonResponse indicating the spectrum data, wavelengths, and deployment info
    """
    try:
        # Retrieve sensor_id, timestamp, and cycle from the GET parameters
        sensor_id = request.GET.get('sensor_id')
        timestamp = request.GET.get('timestamp')
        cycle = request.GET.get('cycle')

        # Validate the presence of the sensor_id, timestamp, and cycle parameters
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")
        if not timestamp:
            raise ValueError("Missing timestamp parameter")
        if not cycle:
            raise ValueError("Missing cycle parameter")

        # Check if the sensor exists in the database
        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Get the full spectrum data, wavelengths, and deployment info for the given parameters
        data, wavelengths, deployment_info = get_spectrums_in_cycle_full_info(timestamp, sensor_id, cycle)

        # Return the response with full spectrum data, wavelengths, and deployment info
        return JsonResponse({
            "data": data,
            "wavelengths": wavelengths,
            "deployment_info": deployment_info
        })

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_spectrum_in_cycle_full_info(request):
    """
    API endpoint to get full spectrum information in a specific cycle for a sensor.

    :param request: HTTP request object
    :return: JsonResponse indicating the spectrum data, wavelengths, and deployment info
    """
    try:
        # Retrieve sensor_id, timestamp, and cycle from the GET parameters
        sensor_id = request.GET.get('sensor_id')
        timestamp = request.GET.get('timestamp')
        cycle = request.GET.get('cycle')

        # Validate the presence of the sensor_id, timestamp, and cycle parameters
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")
        if not timestamp:
            raise ValueError("Missing timestamp parameter")
        if not cycle:
            raise ValueError("Missing cycle parameter")

        # Check if the sensor exists in the database
        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Get the full spectrum data, wavelengths, and deployment info for the given parameters
        data, wavelengths, deployment_info = get_spectrums_in_cycle_full_info(timestamp, sensor_id, cycle)

        # Return the response with full spectrum data, wavelengths, and deployment info
        return JsonResponse({
            "data": data,
            "wavelengths": wavelengths,
            "deployment_info": deployment_info
        })

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_only_wavelength_monitored_through_time_in_cycle_full_info(request):
    """
    API endpoint to get only the monitored wavelengths through time in a specific cycle for a sensor.

    :param request: HTTP request object
    :return: JsonResponse indicating the monitored wavelengths data, wavelengths, and deployment info
    """
    try:
        # Retrieve sensor_id, timestamp, and cycle from the GET parameters
        sensor_id = request.GET.get('sensor_id')
        timestamp = request.GET.get('timestamp')
        cycle = request.GET.get('cycle')

        # Validate the presence of the sensor_id, timestamp, and cycle parameters
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")
        if not timestamp:
            raise ValueError("Missing timestamp parameter")
        if not cycle:
            raise ValueError("Missing cycle parameter")

        # Check if the sensor exists in the database
        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Get the monitored wavelengths data, wavelengths, and deployment info for the given parameters
        data, wavelengths, deployment_info = get_only_wavelength_monitored_through_time_in_cycle_full_info(timestamp, sensor_id, cycle)

        # Return the response with monitored wavelengths data, wavelengths, and deployment info
        return JsonResponse({
            "data": data,
            "wavelengths": wavelengths,
            "deployment_info": deployment_info
        })

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_spectrum_in_deployment_full_info(request):
    """
    API endpoint to get full spectrum information in a specific deployment for a sensor.

    :param request: HTTP request object
    :return: JsonResponse indicating the spectrum data, wavelengths, and deployment info
    """
    try:
        # Retrieve sensor_id and timestamp from the GET parameters
        sensor_id = request.GET.get('sensor_id')
        timestamp = request.GET.get('timestamp')

        # Validate the presence of the sensor_id and timestamp parameters
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")
        if not timestamp:
            raise ValueError("Missing timestamp parameter")

        # Check if the sensor exists in the database
        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Get the full spectrum data, wavelengths, and deployment info for the given parameters
        data, wavelengths, deployment_info = get_spectrums_in_deployment_full_info(timestamp, sensor_id)

        # Return the response with full spectrum data, wavelengths, and deployment info
        return JsonResponse({
            "data": data,
            "wavelengths": wavelengths,
            "deployment_info": deployment_info
        })

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_monitored_wavelength_values_in_deployment(request):
    """
    API endpoint to get monitored wavelength values in a specific deployment for a sensor.

    :param request: HTTP request object
    :return: JsonResponse indicating the monitored wavelength values and deployment info
    """
    try:
        # Retrieve sensor_id and timestamp from the GET parameters
        sensor_id = request.GET.get('sensor_id')
        timestamp = request.GET.get('timestamp')

        # Validate the presence of the sensor_id and timestamp parameters
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")
        if not timestamp:
            raise ValueError("Missing timestamp parameter")

        # Check if the sensor exists in the database
        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Get the monitored wavelength values and deployment info for the given parameters
        data, deployment_info = get_monitored_wavelength_values_in_deployment(timestamp, sensor_id)

        # Return the response with monitored wavelength values and deployment info
        return JsonResponse({
            "data": data,
            "deployment_info": deployment_info
        })

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_absorbance_spectrums_in_deployment_full_info(request):
    """
    API endpoint to get absorbance spectrums in a specific deployment for a sensor.

    :param request: HTTP request object
    :return: JsonResponse indicating the absorbance data, wavelengths, and deployment info
    """
    try:
        # Retrieve sensor_id and timestamp from the GET parameters
        sensor_id = request.GET.get('sensor_id')
        timestamp = request.GET.get('timestamp')

        # Validate the presence of the sensor_id and timestamp parameters
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")
        if not timestamp:
            raise ValueError("Missing timestamp parameter")

        # Check if the sensor exists in the database
        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Get the absorbance spectrums data, wavelengths, and deployment info for the given parameters
        data, wavelengths, deployment_info = get_absorbance_spectrums_in_deployment_full_info(timestamp, sensor_id)

        # Return the response with absorbance spectrums data, wavelengths, and deployment info
        return JsonResponse({
            "data": data,
            "wavelengths": wavelengths,
            "deployment_info": deployment_info
        })

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_standard_concentration(request):
    """
    API endpoint to get the standard concentration of a reaction.

    :param request: HTTP request object
    :return: JsonResponse indicating the standard concentration or an error message
    """
    # Retrieve reaction_name and reaction_id from the GET parameters
    reaction_name = request.GET.get('reaction_name')
    reaction_id = request.GET.get('reaction_id')

    # Validate reaction_id format if provided
    if reaction_id is not None:
        try:
            reaction_id = int(reaction_id)
        except ValueError:
            return JsonResponse({'error': 'Invalid reaction ID format'}, status=400)

    # Get the standard concentration using the provided reaction_name or reaction_id
    concentration = q.get_standard_concentration(reaction_name=reaction_name, reaction_id=reaction_id)

    # Return the standard concentration if found
    if concentration is not None:
        return JsonResponse({'standard_concentration': concentration})
    else:
        # Return an error message if the reaction is not found
        return JsonResponse({'error': 'Reaction not found'}, status=404)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_lasts_spectrum_cycle_0(request):
    """
    API endpoint to get the last three spectrums for cycle 0 of a sensor.

    :param request: HTTP request object
    :return: JsonResponse indicating the last three spectrums or an error message
    """
    # Retrieve sensor_id from the GET parameters
    sensor_id = request.GET.get('sensor_id')

    # Validate sensor_id format if provided
    if sensor_id is not None:
        try:
            sensor_id = int(sensor_id)
        except ValueError:
            return JsonResponse({'error': 'Invalid sensor ID format'}, status=400)

    # Get the last three spectrums for cycle 0 using the provided sensor_id
    last_spectrum_cycle_0 = q.get_3_last_spectrum_cycle_0(sensor_id)

    # Return the last three spectrums if found
    if last_spectrum_cycle_0 is not None:
        return JsonResponse({'last_spectrum_cycle_0': last_spectrum_cycle_0})
    else:
        # Return an error message if the spectrums are not found
        return JsonResponse({'error': 'Spectrums not found'}, status=404)


@login_required()
@csrf_exempt
def api_get_current_reagents_from_current_reaction(request):
    """
    API endpoint to get the current reagents from the current reaction for a sensor.

    :param request: HTTP request object
    :return: JsonResponse indicating the current reagents or an error message
    """
    try:
        # Retrieve sensor_id from the GET parameters
        sensor_id = request.GET.get('sensor_id')

        # Validate the presence of the sensor_id parameter
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        # Check if the sensor exists in the database
        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Get the current reagents for the current reaction using the provided sensor_id
        current_reagents = q.get_reagents_for_current_reaction(sensor_id)

        # Return the current reagents if found
        return JsonResponse(
            {'status': 'success', 'current_reagents': current_reagents if current_reagents else []})

    except Exception as e:
        # Catch any unexpected errors and return an error message
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_concentration_for_deployment(request):
    """
    API endpoint to get concentration data for a specific deployment for a sensor.

    :param request: HTTP request object
    :return: JsonResponse indicating the concentration data and deployment info
    """
    try:
        # Retrieve sensor_id and timestamp from the GET parameters
        sensor_id = request.GET.get('sensor_id')
        timestamp = request.GET.get('timestamp')

        # Validate the presence of the sensor_id and timestamp parameters
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")
        if not timestamp:
            raise ValueError("Missing timestamp parameter")

        # Check if the sensor exists in the database
        if not q.models.Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Get the concentration data and deployment info for the given parameters
        absorbance_data, deployment_info = get_concentration_in_deployment(timestamp, sensor_id)

        # Return the response with concentration data and deployment info
        return JsonResponse({
            "spectrums_data": absorbance_data,
            "deployment_info": deployment_info
        })

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["GET"])
@csrf_exempt
def api_get_deployment_list(request):
    """
    API endpoint to get the list of deployments for a sensor.

    :param request: HTTP request object
    :return: JsonResponse indicating the deployment list or an error message
    """
    try:
        # Retrieve sensor_id from the GET parameters
        sensor_id = request.GET.get('sensor_id')

        # Validate the presence of the sensor_id parameter
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")

        # Check if the sensor exists in the database
        if not Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Get the deployment list for the given sensor_id
        deployment_list = get_deployment_list(sensor_id)

        # Return the deployment list
        return JsonResponse(deployment_list, safe=False)

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
@require_http_methods(["DELETE"])
@csrf_exempt
@admin_required
def api_delete_spectrums_by_deployment(request):
    """
    API endpoint to delete spectrums associated with a specific deployment for a sensor.

    :param request: HTTP request object
    :return: JsonResponse indicating success or failure of the deletion operation
    """
    try:
        # Retrieve sensor_id and deployment_id from the GET parameters
        sensor_id = request.GET.get('sensor_id')
        deployment_id = request.GET.get('deployment_id')

        # Validate the presence of the sensor_id and deployment_id parameters
        if not sensor_id:
            raise ValueError("Missing sensor_id parameter")
        if not deployment_id:
            raise ValueError("Missing deployment_id parameter")

        # Check if the sensor exists in the database
        if not Sensor.objects.filter(id=sensor_id).exists():
            return JsonResponse({'status': 'error', 'message': 'Sensor not found'}, status=400)

        # Call the function to delete spectrums by deployment
        q.delete_spectrums_by_deployment(sensor_id, deployment_id)

        # Return success response
        return JsonResponse({'status': 'success', 'message': 'Spectrums deleted successfully'})

    except ValueError as e:
        # Return an error message if validation fails
        return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    except Exception as e:
        # Catch other unexpected errors
        return JsonResponse({'status': 'error', 'message': str(e)}, status=500)


@login_required
def export_raw_spectra_csv(request):
    """
    API endpoint to export raw spectra data as a CSV file.

    :param request: HTTP request object
    :return: HttpResponse with the CSV data or an error message
    """
    # Retrieve timestamp and sensor_id from the GET parameters
    timestamp = request.GET.get('timestamp')
    sensor_id = request.GET.get('sensor_id')

    try:
        # Validate the timestamp parameter
        timestamp = int(timestamp)

        if sensor_id:
            # Call the function to export raw data
            response = export_raw_data(timestamp, sensor_id)
        else:
            # Return an error response if parameters are invalid
            response = HttpResponse("Invalid parameters", status=400)
    except (ValueError, TypeError):
        # Return an error response if timestamp is not a valid integer
        response = HttpResponse("Invalid parameters", status=400)

    return response


@login_required
def export_absorbance_spectra_csv(request):
    """
    API endpoint to export absorbance spectra data as a CSV file.

    :param request: HTTP request object
    :return: HttpResponse with the CSV data or an error message
    """
    # Retrieve timestamp and sensor_id from the GET parameters
    timestamp = request.GET.get('timestamp')
    sensor_id = request.GET.get('sensor_id')

    try:
        # Validate the timestamp parameter
        timestamp = int(timestamp)

        if sensor_id:
            # Call the function to export absorbance data
            response = export_absorbance_data(timestamp, sensor_id)
        else:
            # Return an error response if parameters are invalid
            response = HttpResponse("Invalid parameters", status=400)
    except (ValueError, TypeError):
        # Return an error response if timestamp is not a valid integer
        response = HttpResponse("Invalid parameters", status=400)

    return response


@login_required
def export_concentration_csv(request):
    """
    API endpoint to export concentration data as a CSV file.

    :param request: HTTP request object
    :return: HttpResponse with the CSV data or an error message
    """
    # Retrieve timestamp and sensor_id from the GET parameters
    timestamp = request.GET.get('timestamp')
    sensor_id = request.GET.get('sensor_id')

    try:
        # Validate the timestamp parameter
        timestamp = int(timestamp)

        if sensor_id:
            # Call the function to export concentration data
            response = export_concentration_data(timestamp, sensor_id)
        else:
            # Return an error response if parameters are invalid
            response = HttpResponse("Invalid parameters", status=400)
    except (ValueError, TypeError):
        # Return an error response if timestamp is not a valid integer
        response = HttpResponse("Invalid parameters", status=400)

    return response
