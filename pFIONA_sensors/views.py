import csv
import datetime
import json

from django.db import transaction

from pFIONA_api import queries as q

import pandas as pd

from django.contrib.auth.decorators import login_required
from django.http import JsonResponse, HttpResponse
from django.shortcuts import render, redirect, get_object_or_404
from django.views.decorators.csrf import csrf_exempt

from pFIONA_sensors.models import Sensor, Reagent, Step, Reaction, Spectrum
from pFIONA_api.analysis.formula import absorbance
from pFIONA_api.analysis.spectrum_finder import *
from .decorators import admin_required
from .forms import SensorForm, SensorNameAndNotesForm, ReagentEditForm, SensorLatLongForm, SensorSettingsForm
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.views import PasswordChangeView
from django.urls import reverse_lazy


@login_required()
def sensors_list(request):
    """
    Display a list of all sensors.

    :param request: HTTP request object
    :return: Rendered HTML page with the list of sensors
    """
    sensors_list = Sensor.objects.all().order_by('id')  # Get all sensor objects

    context = {
        'sensors_list': sensors_list,
        'current_path': request.path,
    }
    return render(request, 'pFIONA_sensors/view/sensors_list.html', context=context)  # Render the list of sensors


@login_required()
@admin_required
def sensors_manual(request, sensor_id):
    """
    Display manual control interface for a specific sensor.

    :param request: HTTP request object
    :param sensor_id: ID of the sensor
    :return: Rendered HTML page for manual sensor control
    """
    sensor = get_object_or_404(Sensor, pk=sensor_id)  # Get the sensor object or return 404 if not found
    user_groups = request.user.groups.values_list('name', flat=True)  # Get user groups

    return render(request, 'pFIONA_sensors/view/sensors_manual.html',
                  {
                      'id': sensor_id,
                      'ip_address': sensor.ip_address,
                      'sensor': sensor,
                      'user_groups': user_groups,
                  })  # Render the manual control page


@login_required()
@admin_required
def sensors_deploy(request, sensor_id):
    """
    Display deployment interface for a specific sensor.

    :param request: HTTP request object
    :param sensor_id: ID of the sensor
    :return: Rendered HTML page for sensor deployment
    """
    sensor = get_object_or_404(Sensor, pk=sensor_id)  # Get the sensor object or return 404 if not found
    user_groups = request.user.groups.values_list('name', flat=True)  # Get user groups
    return render(request, 'pFIONA_sensors/view/sensors_deploy.html',
                  {'id': sensor_id, 'sensor': sensor, 'ip_address': sensor.ip_address,
                   'user_groups': user_groups, })  # Render the deployment page


@login_required()
def sensors_data(request, sensor_id):
    """
    Display data interface for a specific sensor.

    :param request: HTTP request object
    :param sensor_id: ID of the sensor
    :return: Rendered HTML page for sensor data
    """
    sensor = get_object_or_404(Sensor, pk=sensor_id)  # Get the sensor object or return 404 if not found
    user_groups = request.user.groups.values_list('name', flat=True)  # Get user groups
    return render(request, 'pFIONA_sensors/view/sensors_data.html',
                  {'id': sensor_id, 'sensor': sensor, 'ip_address': sensor.ip_address,
                   'user_groups': user_groups, })  # Render the data page


@login_required()
def sensors_reagents(request, sensor_id):
    """
    Display reagents interface for a specific sensor.

    :param request: HTTP request object
    :param sensor_id: ID of the sensor
    :return: Rendered HTML page for sensor reagents
    """
    sensor = get_object_or_404(Sensor, pk=sensor_id)  # Get the sensor object or return 404 if not found
    user_groups = request.user.groups.values_list('name', flat=True)  # Get user groups

    # REAGENTS
    reagents = Reagent.objects.filter(pfiona_sensor_id=sensor_id)  # Get reagents associated with the sensor

    reagents_data = [{
        'id': reagent.id,
        'name': reagent.name,
        'volume': reagent.volume,
        'volume_max': reagent.volume_max,
        'port': reagent.port,
        'sensor_id': reagent.pfiona_sensor_id,
    } for reagent in reagents]  # Prepare reagents data for JSON

    reagents_json = json.dumps(reagents_data)  # Convert reagents data to JSON

    # REACTIONS
    volume_to_adds = Step.objects.filter(pfiona_reagent__in=reagents)  # Get steps associated with the reagents
    reactions = Reaction.objects.filter(step__in=volume_to_adds).distinct().order_by('name')  # Get unique reactions

    reactions_data = [{
        'id': reaction.id,
        'name': reaction.name,
    } for reaction in reactions]  # Prepare reactions data for JSON

    reactions_json = json.dumps(reactions_data)  # Convert reactions data to JSON

    print(reactions_json)  # Print reactions data for debugging

    # RENDER
    return render(request, 'pFIONA_sensors/view/sensors_reagents.html', {
        'id': sensor_id,
        'ip_address': sensor.ip_address,
        'reagents_json': reagents_json,
        'reactions_json': reactions_json,
        'sensor': sensor,
        'user_groups': user_groups,
    })  # Render the reagents page


@login_required()
@csrf_exempt
@admin_required
def sensors_reagents_valve_update(request, sensor_id):
    """
    Update the valve ports for reagents of a specific sensor.

    :param request: HTTP request object
    :param sensor_id: ID of the sensor
    :return: JsonResponse indicating success or failure of the update
    """
    if request.method == 'POST':
        try:
            data = json.loads(request.body.decode('utf-8'))  # Parse the request body as JSON
            print(data)  # Print the data for debugging

            Reagent.objects.filter(pfiona_sensor_id=sensor_id).update(
                port=None)  # Reset all ports for the sensor's reagents

            for index, reagent_id in enumerate(data):
                if reagent_id != 'none':
                    Reagent.objects.filter(id=int(reagent_id)).update(
                        port=index + 1)  # Update the port for each reagent

            return JsonResponse({'status': 'success', 'message': 'Ports updated successfully'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=400)
    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request'}, status=400)


@login_required()
@admin_required
def sensors_reagent_delete(request, sensor_id, reagent_id):
    """
    Display the confirmation page for deleting a reagent.

    :param request: HTTP request object
    :param sensor_id: ID of the sensor
    :param reagent_id: ID of the reagent
    :return: Rendered HTML page for reagent deletion confirmation
    """
    reagent = get_object_or_404(Reagent, pk=reagent_id)  # Get the reagent object or return 404 if not found
    reactions = q.get_reactions_associated_reagent(reagent_id)  # Get reactions associated with the reagent

    return render(request, 'pFIONA_sensors/view/sensors_reagent_delete.html', {
        'sensor_id': sensor_id,
        'reagent': reagent,
        'reactions': reactions,
    })  # Render the reagent deletion confirmation page


@login_required()
@admin_required
def sensors_reagent_deletion(request, sensor_id, reagent_id):
    """
    Delete a reagent and its associated reactions.

    :param request: HTTP request object
    :param sensor_id: ID of the sensor
    :param reagent_id: ID of the reagent
    :return: Redirect to the reagents page after deletion
    """
    reagent = get_object_or_404(Reagent, pk=reagent_id)  # Get the reagent object or return 404 if not found

    with transaction.atomic():  # Use a transaction to ensure atomicity
        standard_reactions = Reaction.objects.filter(
            standard_id=reagent_id)  # Get reactions where the reagent is the standard
        standard_reaction_ids = set(standard_reactions.values_list('id', flat=True))  # Get the IDs of these reactions

        volume_to_adds = Step.objects.filter(pfiona_reagent_id=reagent_id)  # Get steps where the reagent is used
        reaction_ids_from_volume_to_add = set(
            vta.pfiona_reaction_id for vta in volume_to_adds)  # Get the reaction IDs from these steps
        reaction_ids = standard_reaction_ids.union(reaction_ids_from_volume_to_add)  # Combine the reaction IDs

        Reaction.objects.filter(id__in=reaction_ids).delete()  # Delete the reactions

        reagent.delete()  # Delete the reagent

    return redirect('sensors_reagents', sensor_id=sensor_id)  # Redirect to the reagents page


@login_required()
@admin_required
def sensors_reaction_delete(request, sensor_id, reaction_id):
    """
    Delete a reaction.

    :param request: HTTP request object
    :param sensor_id: ID of the sensor
    :param reaction_id: ID of the reaction
    :return: Redirect to the reagents page after deletion
    """
    sensor = get_object_or_404(Sensor, pk=sensor_id)  # Get the sensor object or return 404 if not found
    sensor.actual_reaction_id = None  # Reset the actual reaction ID for the sensor
    sensor.save()  # Save the sensor

    reaction = get_object_or_404(Reaction, pk=reaction_id)  # Get the reaction object or return 404 if not found
    reaction.delete()  # Delete the reaction

    return redirect('sensors_reagents', sensor_id=sensor_id)  # Redirect to the reagents page


@login_required()
@admin_required
def sensors_reagent_edit(request, sensor_id, reagent_id):
    """
    Edit a reagent.

    :param request: HTTP request object
    :param sensor_id: ID of the sensor
    :param reagent_id: ID of the reagent
    :return: Rendered HTML page for reagent editing
    """
    reagent = get_object_or_404(Reagent, pk=reagent_id)  # Get the reagent object or return 404 if not found
    reagent_form = ReagentEditForm(request.POST or None, instance=reagent, prefix='reagent')  # Create the reagent form

    if request.method == 'POST':
        if 'submit_reagent' in request.POST:
            reagent_form = ReagentEditForm(request.POST, instance=reagent,
                                           prefix='reagent')  # Update the reagent form with POST data
            if reagent_form.is_valid():
                reagent_form.save()  # Save the form if valid
                return redirect('sensors_reagents', sensor_id=sensor_id)  # Redirect to the reagents page
    return render(request, 'pFIONA_sensors/view/sensors_reagent_edit.html', {
        'id': sensor_id,
        'reagent_form': reagent_form,
    })  # Render the reagent editing page


@login_required()
@admin_required
def sensors_reagent_add(request, sensor_id):
    """
    Add a new reagent.

    :param request: HTTP request object
    :param sensor_id: ID of the sensor
    :return: Rendered HTML page for reagent addition
    """
    if request.method == 'POST':
        reagent_form = ReagentEditForm(request.POST, prefix='reagent')  # Create the reagent form with POST data
        if reagent_form.is_valid():
            max_id = \
                Reagent.objects.filter(id__gte=sensor_id * 10000000,
                                       id__lte=(sensor_id + 1) * 10000000).aggregate(Max('id'))[
                    'id__max']  # Get the maximum ID for the sensor's reagents

            if max_id is None:
                max_id = sensor_id * 10000000  # Set the initial ID if none exists
            new_reagent = reagent_form.save(commit=False)  # Create the new reagent without saving to the database
            new_reagent.pfiona_sensor_id = sensor_id  # Set the sensor ID
            new_reagent.volume = 0  # Set the initial volume
            new_reagent.id = max_id + 1  # Set the new ID
            new_reagent.save()  # Save the new reagent
            return redirect('sensors_reagents', sensor_id=sensor_id)  # Redirect to the reagents page
    else:
        reagent_form = ReagentEditForm(prefix='reagent')  # Create an empty reagent form

    return render(request, 'pFIONA_sensors/view/sensors_reagent_add.html', {
        'id': sensor_id,
        'reagent_form': reagent_form,
    })  # Render the reagent addition page


@login_required
@admin_required
def sensors_settings(request, sensor_id):
    """
    Edit sensor settings.

    :param request: HTTP request object
    :param sensor_id: ID of the sensor
    :return: Rendered HTML page for sensor settings
    """
    sensor = get_object_or_404(Sensor, pk=sensor_id)  # Get the sensor object or return 404 if not found
    name_notes_form = SensorNameAndNotesForm(request.POST or None, instance=sensor,
                                             prefix='name_notes')  # Create the name and notes form
    lat_long_form = SensorLatLongForm(request.POST or None, instance=sensor,
                                      prefix='lat_long')  # Create the latitude and longitude form
    sensor_settings_form = SensorSettingsForm(request.POST or None, instance=sensor,
                                              prefix='settings')  # Create the settings form
    user_groups = request.user.groups.values_list('name', flat=True)  # Get user groups

    if request.method == 'POST':
        if 'submit_name_notes' in request.POST:
            name_notes_form = SensorNameAndNotesForm(request.POST, instance=sensor,
                                                     prefix='name_notes')  # Update the name and notes form with POST data
            if name_notes_form.is_valid():
                name_notes_form.save()  # Save the form if valid
                return redirect('sensors_settings', sensor_id=sensor_id)  # Redirect to the settings page
            # Reinitialize other forms to preserve the existing values
            lat_long_form = SensorLatLongForm(None, instance=sensor, prefix='lat_long')
            sensor_settings_form = SensorSettingsForm(None, instance=sensor, prefix='settings')
        elif 'submit_lat_long' in request.POST:
            lat_long_form = SensorLatLongForm(request.POST, instance=sensor,
                                              prefix='lat_long')  # Update the latitude and longitude form with POST data
            if lat_long_form.is_valid():
                lat_long_form.save()  # Save the form if valid
                return redirect('sensors_settings', sensor_id=sensor_id)  # Redirect to the settings page
            # Reinitialize other forms to preserve the existing values
            name_notes_form = SensorNameAndNotesForm(None, instance=sensor, prefix='name_notes')
            sensor_settings_form = SensorSettingsForm(None, instance=sensor, prefix='settings')
        elif 'submit_sensor_settings' in request.POST:
            sensor_settings_form = SensorSettingsForm(request.POST, instance=sensor,
                                                      prefix='settings')  # Update the settings form with POST data
            if sensor_settings_form.is_valid():
                sensor_settings_form.save()  # Save the form if valid
                return redirect('sensors_settings', sensor_id=sensor_id)  # Redirect to the settings page
            # Reinitialize other forms to preserve the existing values
            name_notes_form = SensorNameAndNotesForm(None, instance=sensor, prefix='name_notes')
            lat_long_form = SensorLatLongForm(None, instance=sensor, prefix='lat_long')

    return render(request, 'pFIONA_sensors/view/sensors_settings.html',
                  {'id': sensor_id, 'name_notes_form': name_notes_form, 'sensor': sensor,
                   'lat_long_form': lat_long_form, 'sensor_settings_form': sensor_settings_form,
                   'user_groups': user_groups})  # Render the settings page


@login_required()
@admin_required
def sensors_reaction_add(request, sensor_id):
    """
    Add a new reaction.

    :param request: HTTP request object
    :param sensor_id: ID of the sensor
    :return: Rendered HTML page for reaction addition
    """
    reagents_json = q.get_utils_reagents(sensor_id, return_json=True)  # Get reagents data in JSON format

    return render(request, 'pFIONA_sensors/view/sensors_reaction_add.html', {
        'id': sensor_id,
        'reagents_json': reagents_json,
    })  # Render the reaction addition page


@login_required()
@admin_required
def sensors_reaction_edit(request, sensor_id, reaction_id):
    """
    Edit an existing reaction.

    :param request: HTTP request object
    :param sensor_id: ID of the sensor
    :param reaction_id: ID of the reaction
    :return: Rendered HTML page for reaction editing
    """
    reagents_json = q.get_utils_reagents(sensor_id, return_json=True)  # Get reagents data in JSON format
    reaction_json = q.get_reaction_details(reaction_id=reaction_id,
                                           sensor_id=sensor_id)  # Get reaction details in JSON format

    return render(request, 'pFIONA_sensors/view/sensors_reaction_edit.html', {
        'id': sensor_id,
        'reagents_json': reagents_json,
        'reaction_json': reaction_json
    })  # Render the reaction editing page
