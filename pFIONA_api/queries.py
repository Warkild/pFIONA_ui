from math import floor

from django.db import transaction
from django.db.models import Q, F, Max, When, Case, OuterRef, Value, IntegerField, Subquery

import pFIONA_sensors.models as models
import json

state_dict = {'Boot': 0,
              'Flush': 1,
              'Mix': 2,
              'Change_Valve': 3,
              'Scan': 4,
              'Pump_Sample_from_ocean': 5,
              'Push_to_flow_cell': 6,
              'Multi_standard_spectrum': 7,
              'Wait': 8,
              'Darkspectrum': 9,
              'Idle': 10,
              'Reference_spectrum': 11,
              'Blank_spectrum': 12,
              'Sample_spectrum': 13,
              'Standard_spectrum': 14,
              'Deployed': 15,
              'Sleep': 16,
              'Shutdown': 17,
              'Stop_deploying_in_progress': 18,
              'Error': 19,
              }


def get_utils_reagents(sensor_id, return_json=False):
    """
    Retrieve useful reagents from the database, excluding waste, samples, etc.

    :param sensor_id: The ID of the sensor to filter reagents by.
    :param return_json: A boolean indicating whether to return the data as a JSON object.

    :return: A list of reagents, either as Django model instances or as JSON data.
    """

    # Query the Reagent model to get all reagents associated with the given sensor ID
    # and having a maximum volume greater than 0 (indicating they are usable reagents).
    reagents = models.Reagent.objects.filter(pfiona_sensor_id=sensor_id).filter(Q(volume_max__gt=0))

    # If return_json is True, convert the queryset to a JSON object.
    if return_json:
        # Create a list of dictionaries where each dictionary represents a reagent's data.
        reagents_data = [{
            'id': reagent.id,
            'name': reagent.name,
            'volume': reagent.volume,
            'volume_max': reagent.volume_max,
            'port': reagent.port,
            'sensor_id': reagent.pfiona_sensor_id,
            'is_standard': bool(reagent.is_standard),  # Convert to boolean for JSON compatibility.
        } for reagent in reagents]

        # Convert the list of dictionaries to a JSON string.
        reagents_json = json.dumps(reagents_data)

        # Return the JSON string.
        return reagents_json
    else:
        # If return_json is False, return the queryset as-is (a list of Django model instances).
        return reagents


def delete_spectrums_by_deployment(sensor_id, deployment_id):
    """
    Deletes all spectrums belonging to a specific deployment for a given sensor_id.

    :param sensor_id: The ID of the sensor for which to delete spectrums.
    :param deployment_id: The ID of the deployment for which to delete spectrums.
    """
    try:
        # Use a transaction to ensure atomicity of the delete operation
        with transaction.atomic():
            # Filter the Spectrum objects by sensor_id and deployment_id, then delete them
            models.Spectrum.objects.filter(pfiona_sensor_id=sensor_id, deployment=deployment_id).delete()

            # Print a success message after deletion
            print(
                f"All spectrums for sensor_id {sensor_id} and deployment {deployment_id} have been successfully deleted.")

    except Exception as e:
        # Catch any exceptions that occur during the delete operation
        # Print an error message if something goes wrong
        print(f"An error occurred while deleting spectrums: {e}")


def create_reaction(name, standard_id, standard_concentration, volume_of_mixture, volume_to_push_to_flow_cell,
                    number_of_blank, number_of_sample, number_of_standard, multi_standard, multi_standard_time,
                    reaction_time, crm, crm_time):
    """
    Create a reaction in database

    :param name: Name of reaction
    :param standard_id: Standard ID of reaction
    :param standard_concentration: Standard concentration of reaction
    :param volume_of_mixture: Volume of mixture of reaction
    :param volume_to_push_to_flow_cell: Volume to push to flow cell of reaction
    :param number_of_blank : Number of blank in each cycle
    :param number_of_standard : Number of standard cycle in each cycle
    :param number_of_sample : Number of sample in each cycle
    :param multi_standard : True or False for multi-standard reaction
    :param multi_standard_time : Time for multi-standard reaction
    :param reaction_time : Time for reaction
    :param crm : True or False for crm in reaction
    :param crm_time : Time for each crm

    :return: Reaction object
    """

    # Retrieve the standard reagent object using the provided standard_id
    standard = models.Reagent.objects.get(id=standard_id)

    # Calculate the sensor ID based on the standard ID
    sensor_id = floor(standard_id / 10000000000)

    # Define the range of possible IDs for the new reaction
    min_id = sensor_id * 10000000000
    max_id = ((sensor_id + 1) * 10000000000) - 1

    creating_id = None

    # Retrieve existing reaction IDs within the calculated range
    existing_ids = set(models.Reaction.objects.filter(id__gte=min_id, id__lte=max_id).values_list('id', flat=True))

    # Find the first available ID within the specified range
    for possible_id in range(min_id, max_id + 1):
        if possible_id not in existing_ids:
            creating_id = possible_id
            break

    # Create a new Reaction object with the specified parameters and the determined ID
    reaction = models.Reaction.objects.create(
        name=name,
        standard_concentration=standard_concentration,
        standard=standard,
        volume_of_mixture=volume_of_mixture,
        volume_to_push_to_flow_cell=volume_to_push_to_flow_cell,
        number_of_blank=number_of_blank,
        number_of_standard=number_of_standard,
        number_of_sample=number_of_sample,
        multi_standard=multi_standard,
        multi_standard_time=multi_standard_time,
        reaction_time=reaction_time,
        id=creating_id,
        crm=crm,
        crm_time=crm_time,
    )

    # Save the newly created reaction to the database
    reaction.save()

    # Return the created reaction object
    return reaction


def create_step(reagent_id, reaction_id, number, order):
    """
    Create a step object in database

    :param reagent_id: Reagent ID (or null if waiting time)
    :param reaction_id: Reaction ID
    :param number: Volume to add / Waiting time (depends on param reagent_id)
    :param order: Order of the action in reaction

    :return: Step object
    """

    # Calculate the sensor ID based on the reaction ID
    sensor_id = floor(reaction_id / 10000000000)

    # Define the range of possible IDs for the new step
    min_id = sensor_id * 10000000000
    max_id = ((sensor_id + 1) * 10000000000) - 1

    creating_id = None

    # Retrieve existing step IDs within the calculated range
    existing_ids = set(models.Step.objects.filter(id__gte=min_id, id__lte=max_id).values_list('id', flat=True))

    # Find the first available ID within the specified range
    for possible_id in range(min_id, max_id + 1):
        if possible_id not in existing_ids:
            creating_id = possible_id
            break

    # Create a new Step object with the specified parameters and the determined ID
    step = models.Step.objects.create(
        pfiona_reagent_id=reagent_id,
        pfiona_reaction_id=reaction_id,
        number=number,
        order=order,
        id=creating_id
    )

    # Save the newly created step to the database
    step.save()

    # Return the created step object
    return step


def create_monitored_wavelength(reaction_id, wavelength):
    """
    Create a monitored wavelength object in the database

    :param reaction_id: Reaction ID
    :param wavelength: Wavelength to be monitored

    :return: WavelengthMonitored object
    """

    # Calculate the sensor ID based on the reaction ID
    sensor_id = floor(reaction_id / 10000000000)

    # Define the range of possible IDs for the new monitored wavelength
    min_id = sensor_id * 10000000000
    max_id = ((sensor_id + 1) * 10000000000) - 1

    creating_id = None

    # Retrieve existing monitored wavelength IDs within the calculated range
    existing_ids = set(
        models.WavelengthMonitored.objects.filter(id__gte=min_id, id__lte=max_id).values_list('id', flat=True))

    # Find the first available ID within the specified range
    for possible_id in range(min_id, max_id + 1):
        if possible_id not in existing_ids:
            creating_id = possible_id
            break

    # Create a new WavelengthMonitored object with the specified parameters and the determined ID
    monitored_wavelength = models.WavelengthMonitored.objects.create(
        pfiona_reaction_id=reaction_id,
        wavelength=wavelength,
        id=creating_id
    )

    # Save the newly created monitored wavelength to the database
    monitored_wavelength.save()

    # Return the created monitored wavelength object
    return monitored_wavelength


def get_reaction_details(reaction_id=None, reaction_name=None, sensor_id=None):
    """
    Get reaction details with the reaction and step details.

    :param reaction_id: Reaction ID
    :param reaction_name: Reaction Name
    :param sensor_id: Sensor ID

    :return: JSON Object (Reaction details)
    """

    # Ensure sensor_id is provided, raise an error if not
    if not sensor_id:
        raise ValueError("sensor_id must be provided")

    # Fetch reaction based on reaction_id if provided
    if reaction_id:
        reaction = models.Reaction.objects.filter(id=reaction_id, standard__pfiona_sensor_id=sensor_id).first()
    # Fetch reaction based on reaction_name if provided and reaction_id is not provided
    elif reaction_name:
        reaction = models.Reaction.objects.filter(name=reaction_name, standard__pfiona_sensor_id=sensor_id).first()
    else:
        # Raise an error if neither reaction_id nor reaction_name is provided
        raise ValueError("Either reaction_id or reaction_name must be provided")

    # Raise an error if no reaction is found with the given parameters
    if not reaction:
        raise ValueError("No reaction found with the given parameters")

    # Get the steps related to the reaction to have the full reaction details
    step_list = models.Step.objects.filter(pfiona_reaction_id=reaction.id).order_by('order')

    # Convert step details to JSON-compatible format
    step_json = [{
        'reagent_id': step.pfiona_reagent_id,
        'number': step.number
    } for step in step_list]

    # Get the monitored wavelengths related to the reaction
    wavelength_list = models.WavelengthMonitored.objects.filter(pfiona_reaction_id=reaction.id)

    # Extract and sort wavelengths
    monitored_wavelengths = sorted([wavelength.wavelength for wavelength in wavelength_list])

    # Create a dictionary with all the information about the reaction
    reaction_json = json.dumps({
        'id': reaction.id,
        'name': reaction.name,
        'standard_id': reaction.standard.id,
        'standard_concentration': reaction.standard_concentration,
        'actions': step_json,
        'volume_of_mixture': reaction.volume_of_mixture,
        'volume_to_push_to_flow_cell': reaction.volume_to_push_to_flow_cell,
        'monitored_wavelengths': monitored_wavelengths,
        'multi_standard': reaction.multi_standard,
        'multi_standard_time': reaction.multi_standard_time,
        'number_of_blank': reaction.number_of_blank,
        'number_of_sample': reaction.number_of_sample,
        'number_of_standard': reaction.number_of_standard,
        'reaction_time': reaction.reaction_time,
        'crm': reaction.crm,
        'crm_time': reaction.crm_time
    })

    # Return the reaction details as a JSON string
    return reaction_json


def delete_all_step(reaction_id):
    """
    Delete all step objects in the database associated with a specific reaction ID.

    :param reaction_id: Reaction ID
    """

    # Filter the Step objects by the given reaction_id and delete all matching entries
    models.Step.objects.filter(pfiona_reaction_id=reaction_id).delete()


def update_reaction(reaction_id, name, standard_id, standard_concentration, volume_of_mixture,
                    volume_to_push_to_flow_cell, number_of_blank, number_of_sample, number_of_standard,
                    multi_standard, multi_standard_time, reaction_time, crm, crm_time):
    """
    Update a reaction in the database

    :param reaction_id: Reaction ID
    :param name: Name of reaction
    :param standard_id: Standard ID of reaction
    :param standard_concentration: Standard concentration of reaction
    :param volume_of_mixture: Volume of mixture of reaction
    :param volume_to_push_to_flow_cell: Volume to push to flow cell of reaction
    :param number_of_blank: Number of blanks in each cycle
    :param number_of_standard: Number of standard cycles in each cycle
    :param number_of_sample: Number of samples in each cycle
    :param multi_standard: True or False for multi-standard reaction
    :param multi_standard_time: Time for multi-standard reaction
    :param reaction_time: Time of reaction
    :param crm: True or False for crm in reaction
    :param crm_time: Time for each crm

    :return: Reaction object
    """

    # Retrieve the reaction object from the database using the provided reaction_id
    reaction = models.Reaction.objects.get(id=reaction_id)

    # Update the reaction's attributes with the provided values
    reaction.name = name
    reaction.standard_concentration = standard_concentration
    reaction.standard_id = standard_id
    reaction.volume_of_mixture = volume_of_mixture
    reaction.volume_to_push_to_flow_cell = volume_to_push_to_flow_cell
    reaction.number_of_blank = number_of_blank
    reaction.number_of_sample = number_of_sample
    reaction.number_of_standard = number_of_standard
    reaction.multi_standard = multi_standard
    reaction.multi_standard_time = multi_standard_time
    reaction.reaction_time = reaction_time
    reaction.crm = crm
    reaction.crm_time = crm_time

    # Save the updated reaction object back to the database
    reaction.save()

    # Return the updated reaction object
    return reaction


def get_current_reaction(sensor_id):
    """
    Get the current reaction for a given sensor.

    :param sensor_id: Sensor ID

    :return: Current reaction
    """

    # Retrieve the sensor object from the database using the provided sensor_id
    sensor = models.Sensor.objects.get(id=sensor_id)

    # Check if the sensor has an actual_reactions attribute that is not None
    if sensor.actual_reactions is not None:
        # Return the current reaction associated with the sensor
        return sensor.actual_reactions
    else:
        # Return None if there is no current reaction associated with the sensor
        return None


def set_current_reaction(sensor_id, reaction_ids):
    """
    Set current reactions for a sensor in the database.

    :param sensor_id: Sensor ID
    :param reaction_ids: List of Reaction IDs (or empty list)
    """

    # Retrieve the sensor object from the database using the provided sensor_id
    sensor = models.Sensor.objects.get(id=sensor_id)

    if reaction_ids:
        # Retrieve the reactions that match the provided reaction_ids
        reactions = models.Reaction.objects.filter(id__in=reaction_ids)
        # Extract the names of the reactions
        reaction_names = [reaction.name for reaction in reactions]
        # Set the sensor's actual_reactions attribute to the list of reaction names
        sensor.actual_reactions = reaction_names
        # Save the updated sensor object to the database
        sensor.save()
    else:
        # If no reaction_ids are provided, set the sensor's actual_reactions attribute to an empty list
        sensor.actual_reactions = []
        # Save the updated sensor object to the database
        sensor.save()


def get_reactions_associated_reagent(reagent_id):
    """
    Get all reactions associated with a reagent and those where the reagent is used as the standard reagent.

    :param reagent_id: Reagent ID

    :return: List of reactions
    """

    # Retrieve all Step objects where the reagent is used, filtering by pfiona_reagent_id
    volume_to_adds = models.Step.objects.filter(pfiona_reagent_id=reagent_id)
    # Extract the unique reaction IDs from the retrieved Step objects
    reaction_ids = set(vta.pfiona_reaction_id for vta in volume_to_adds)

    # Retrieve all Reaction objects where the reagent is used as the standard reagent
    standard_reactions = models.Reaction.objects.filter(standard_id=reagent_id)
    # Extract the unique reaction IDs from the retrieved Reaction objects
    standard_reaction_ids = set(reaction.id for reaction in standard_reactions)

    # Combine the reaction IDs from both queries
    combined_reaction_ids = reaction_ids.union(standard_reaction_ids)

    # Retrieve the Reaction objects that match the combined reaction IDs
    reactions = list(models.Reaction.objects.filter(id__in=combined_reaction_ids))

    # Return the list of Reaction objects
    return reactions


def get_reagent(reagent_id):
    """
    Retrieve a reagent object from the database using its ID.

    :param reagent_id: Reagent ID

    :return: Reagent object
    """
    # Retrieve the reagent object from the database using the provided reagent_id
    return models.Reagent.objects.get(id=reagent_id)


def is_deployed(sensor_id):
    """
    Check if a sensor is deployed or in the process of stopping deployment.

    :param sensor_id: Sensor ID

    :return: Boolean indicating if the sensor is deployed or stopping deployment
    """
    try:
        # Retrieve the last states of the sensor from the database
        states = models.Sensor.objects.get(id=sensor_id).last_states

        # Load the states from JSON format into a Python list
        states_tab = json.loads(states)

        # Check if the sensor is deployed or in the process of stopping deployment
        return state_dict['Deployed'] in states_tab or state_dict['Stop_deploying_in_progress'] in states_tab

    except Exception as e:
        # In case of any exception (e.g., sensor not found or JSON parsing error), return False
        print(f"Error checking deployment status: {e}")
        return False


def is_stop_deploying_in_progress(sensor_id):
    """
    Check if a sensor is in the process of stopping deployment.

    :param sensor_id: Sensor ID

    :return: Boolean indicating if the sensor is stopping deployment
    """
    try:
        # Retrieve the last states of the sensor from the database
        states = models.Sensor.objects.get(id=sensor_id).last_states

        # Load the states from JSON format into a Python list
        states_tab = json.loads(states)

        # Check if the sensor is in the process of stopping deployment
        return state_dict['Stop_deploying_in_progress'] in states_tab

    except Exception as e:
        # In case of any exception (e.g., sensor not found or JSON parsing error), return False
        print(f"Error checking stop deploying status: {e}")
        return False


def is_sleeping(sensor_id):
    """
    Check if a sensor is in the 'Sleep' state.

    :param sensor_id: Sensor ID

    :return: Boolean indicating if the sensor is in the 'Sleep' state
    """
    try:
        # Retrieve the last states of the sensor from the database
        states = models.Sensor.objects.get(id=sensor_id).last_states

        # Load the states from JSON format into a Python list
        states_tab = json.loads(states)

        # Check if the sensor is in the 'Sleep' state
        return state_dict['Sleep'] in states_tab

    except Exception as e:
        # In case of any exception (e.g., sensor not found or JSON parsing error), return False
        print(f"Error checking sleeping status: {e}")
        return False


def get_sensor_sleep(sensor_id):
    """
    Retrieve the sleep state of a sensor from the database.

    :param sensor_id: Sensor ID

    :return: Boolean indicating if the sensor is in sleep mode
    """
    # Retrieve the sensor object from the database using the provided sensor_id
    sensor = models.Sensor.objects.get(id=sensor_id)

    # Return the sleep attribute of the sensor
    return sensor.sleep


def set_sensor_sleep(sensor_id, sleep):
    """
    Set the sleep state of a sensor in the database.

    :param sensor_id: Sensor ID
    :param sleep: Boolean indicating the desired sleep state
    """
    # Retrieve the sensor object from the database using the provided sensor_id
    sensor = models.Sensor.objects.get(id=sensor_id)

    # Set the sleep attribute of the sensor to the provided sleep value
    sensor.sleep = sleep

    # Save the updated sensor object to the database
    sensor.save()


def get_sensor_sample_frequency(sensor_id):
    """
    Retrieve the sample frequency of a sensor from the database.

    :param sensor_id: Sensor ID

    :return: Sample frequency of the sensor
    """
    # Retrieve the sensor object from the database using the provided sensor_id
    sensor = models.Sensor.objects.get(id=sensor_id)

    # Return the sample_frequency attribute of the sensor
    return sensor.sample_frequency


def set_sample_frequency(sensor_id, sample_frequency):
    """
    Set the sample frequency of a sensor in the database.

    :param sensor_id: Sensor ID
    :param sample_frequency: The desired sample frequency to be set
    """
    # Retrieve the sensor object from the database using the provided sensor_id
    sensor = models.Sensor.objects.get(id=sensor_id)

    # Set the sample_frequency attribute of the sensor to the provided sample_frequency value
    sensor.sample_frequency = sample_frequency

    # Save the updated sensor object to the database
    sensor.save()


def delete_all_wavelength_monitored(reaction_id):
    """
    Delete all WavelengthMonitored objects associated with a specific reaction ID.

    :param reaction_id: Reaction ID
    """
    # Filter the WavelengthMonitored objects by the given reaction_id and delete all matching entries
    models.WavelengthMonitored.objects.filter(pfiona_reaction_id=reaction_id).delete()


def get_last_states(sensor_id):
    """
    Retrieve the last states of a sensor from the database.

    :param sensor_id: Sensor ID

    :return: Last states of the sensor
    """
    # Retrieve the sensor object from the database using the provided sensor_id
    sensor = models.Sensor.objects.get(id=sensor_id)

    # Return the last_states attribute of the sensor
    return sensor.last_states


def get_standard_concentration(reaction_name=None, reaction_id=None, sensor_id=None):
    """
    Retrieve the standard concentration of a reaction from the database.

    :param reaction_name: Name of the reaction (optional)
    :param reaction_id: ID of the reaction (optional)
    :param sensor_id: Sensor ID (optional, required if using reaction_name)

    :return: Standard concentration of the reaction or None if not found
    """
    try:
        # Check if reaction_id is provided
        if reaction_id is not None:
            # Retrieve the reaction using the provided reaction_id
            reaction = models.Reaction.objects.get(id=reaction_id)

        # If reaction_id is not provided, check if both reaction_name and sensor_id are provided
        elif reaction_name is not None and sensor_id is not None:
            # Retrieve the reaction using the provided reaction_name and sensor_id
            reaction = models.Reaction.objects.get(
                name=reaction_name,
                standard__pfiona_sensor_id=sensor_id,
            )
            print(reaction)

        # If neither reaction_id nor the combination of reaction_name and sensor_id is provided, return None
        else:
            return None

        # Return the standard concentration of the retrieved reaction
        return reaction.standard_concentration

    # Handle the case where no matching reaction is found
    except models.Reaction.DoesNotExist:
        return None


def get_reagents_for_current_reaction(sensor_id):
    """
    Get reagents for the current reaction.

    :param sensor_id: Sensor ID
    :return: List of reagent names used in the current reactions, including standards
    """
    # Retrieve the current reaction names for the given sensor
    reaction_names = get_current_reaction(sensor_id)

    # If there are no current reactions, return an empty list
    if not reaction_names:
        return []

    # Initialize a set to store reagent names and avoid duplicates
    reagent_names = set()

    # Iterate through each reaction name
    for reaction_name in reaction_names:
        # Retrieve the first reaction object that matches the given reaction name
        reaction = models.Reaction.objects.filter(name=reaction_name).first()
        if reaction:
            # Include the standard reagent's name if it exists
            if reaction.standard:
                reagent_names.add(reaction.standard.name)

            # Retrieve the steps associated with the reaction
            steps = models.Step.objects.filter(pfiona_reaction=reaction)
            for step in steps:
                # Include the reagent's name from each step if it exists
                if step.pfiona_reagent:
                    reagent_names.add(step.pfiona_reagent.name)

    # Convert the set of reagent names to a list and return it
    return list(reagent_names)


def get_3_last_spectrum_cycle_0(sensor_id):
    """
    Get the three last spectra with cycle 0 for a given sensor.

    :param sensor_id: Sensor ID
    :return: List of dictionaries containing spectrum type and associated values
    """
    # Retrieve the three last spectra for the given sensor and cycle 0, ordered by descending ID
    spectra = models.Spectrum.objects.filter(pfiona_sensor_id=sensor_id, cycle=0).order_by('-id')[:3]

    # Prepare the response data
    response_data = []

    # Iterate over the retrieved spectra
    for spectrum in spectra:
        spectrum_data = {}
        # Add the spectrum type to the dictionary
        spectrum_data['type'] = spectrum.pfiona_spectrumtype.type
        # Retrieve and order the associated values by wavelength, then add them to the dictionary
        spectrum_data['values'] = list(
            models.Value.objects.filter(pfiona_spectrum=spectrum).order_by('wavelength').values('wavelength', 'value')
        )

        # Append the spectrum data to the response list
        response_data.append(spectrum_data)

    # Return the prepared response data
    return response_data


def get_active_ports_names(sensor_id):
    """
    Get the names of reagents with active ports for a given sensor.

    :param sensor_id: Sensor ID
    :return: List of reagent names with active ports
    """
    # Retrieve the names of reagents for the given sensor that have a non-null port
    reagents = models.Reagent.objects.filter(pfiona_sensor_id=sensor_id).exclude(port=None).values_list('name',
                                                                                                        flat=True)

    # Convert the queryset to a list and return it
    return list(reagents)
