from math import floor

from django.db.models import Q, F, Max, When, Case, OuterRef, Value, IntegerField, Subquery
from django.db.models.functions import Coalesce
from django.shortcuts import get_object_or_404

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
    Get utils reagents from database (reagents excepted waste, sample,...)

    :param sensor_id: Sensor ID
    :param return_json: Boolean, if true return json object

    :return: List of reagents
    """

    reagents = models.Reagent.objects.filter(pfiona_sensor_id=sensor_id).filter(Q(volume_max__gt=0))

    if return_json:

        reagents_data = [{
            'id': reagent.id,
            'name': reagent.name,
            'volume': reagent.volume,
            'volume_max': reagent.volume_max,
            'port': reagent.port,
            'sensor_id': reagent.pfiona_sensor_id,
            'is_standard': bool(reagent.is_standard),
        } for reagent in reagents]

        reagents_json = json.dumps(reagents_data)

        return reagents_json

    else:

        return reagents


def create_reaction(name, standard_id, standard_concentration, volume_of_mixture, volume_to_push_to_flow_cell,
                    number_of_blank, number_of_sample, number_of_standard, multi_standard, multi_standard_time,
                    reaction_time):
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

    :return: Reaction object
    """

    standard = models.Reagent.objects.get(id=standard_id)

    sensor_id = floor(standard_id / 10000000)

    min_id = sensor_id * 10000000
    max_id = ((sensor_id + 1) * 10000000)-1

    creating_id = None

    existing_ids = set(models.Reaction.objects.filter(id__gte=min_id, id__lte=max_id).values_list('id', flat=True))

    for possible_id in range(min_id, max_id + 1):
        if possible_id not in existing_ids:
            creating_id = possible_id
            break


    reaction = models.Reaction.objects.create(name=name,
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
                                              id=creating_id
                                              )

    reaction.save()

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

    sensor_id = floor(reaction_id / 10000000)

    min_id = sensor_id * 10000000
    max_id = ((sensor_id + 1) * 10000000)-1

    creating_id = None

    existing_ids = set(models.Step.objects.filter(id__gte=min_id, id__lte=max_id).values_list('id', flat=True))

    for possible_id in range(min_id, max_id + 1):
        if possible_id not in existing_ids:
            creating_id = possible_id
            break

    step = models.Step.objects.create(pfiona_reagent_id=reagent_id, pfiona_reaction_id=reaction_id,
                                      number=number,
                                      order=order,
                                      id=creating_id
                                      )
    step.save()

    return step


def create_monitored_wavelength(reaction_id, wavelength):

    sensor_id = floor(reaction_id / 10000000)

    min_id = sensor_id * 10000000
    max_id = ((sensor_id + 1) * 10000000) - 1

    creating_id = None

    existing_ids = set(models.WavelengthMonitored.objects.filter(id__gte=min_id, id__lte=max_id).values_list('id', flat=True))

    for possible_id in range(min_id, max_id + 1):
        if possible_id not in existing_ids:
            creating_id = possible_id
            break

    monitored_wavelength = models.WavelengthMonitored.objects.create(pfiona_reaction_id=reaction_id,
                                                                     wavelength=wavelength, id=creating_id)
    monitored_wavelength.save()

    return monitored_wavelength


def get_reaction_details(reaction_id=None, reaction_name=None, sensor_id=None):
    """
    Get reaction details with the reaction and step details.

    :param reaction_id: Reaction ID
    :param reaction_name: Reaction Name
    :param sensor_id: Sensor ID

    :return: JSON Object (Reaction details)
    """

    if not sensor_id:
        raise ValueError("sensor_id must be provided")

    if reaction_id:
        reaction = models.Reaction.objects.filter(id=reaction_id, standard__pfiona_sensor_id=sensor_id).first()
    elif reaction_name:
        reaction = models.Reaction.objects.filter(name=reaction_name, standard__pfiona_sensor_id=sensor_id).first()
    else:
        raise ValueError("Either reaction_id or reaction_name must be provided")

    if not reaction:
        raise ValueError("No reaction found with the given parameters")

    # Get the step to have the full reaction details
    step_list = models.Step.objects.filter(pfiona_reaction_id=reaction.id).order_by('order')

    step_json = [{
        'reagent_id': step.pfiona_reagent_id,
        'number': step.number
    } for step in step_list]

    # Get the monitored wavelength to have the full reaction details
    wavelength_list = models.WavelengthMonitored.objects.filter(pfiona_reaction_id=reaction.id)

    monitored_wavelengths = sorted([wavelength.wavelength for wavelength in wavelength_list])

    # Create an object with all the information about the reaction
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
        'reaction_time': reaction.reaction_time
    })

    return reaction_json


def delete_all_step(reaction_id):
    """
    Delete all step object in database associated with a specific reaction id

    :param reaction_id: Reaction ID
    """

    models.Step.objects.filter(pfiona_reaction_id=reaction_id).delete()


def update_reaction(reaction_id, name, standard_id, standard_concentration, volume_of_mixture,
                    volume_to_push_to_flow_cell, number_of_blank, number_of_sample, number_of_standard,
                    multi_standard, multi_standard_time, reaction_time):
    """
    Update a reaction in database

    :param reaction_id: Reaction ID
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
    :param reaction_time : Time of reaction

    :return: Reaction object
    """

    reaction = models.Reaction.objects.get(id=reaction_id)
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
    reaction.save()

    return reaction


def get_current_reaction(sensor_id):
    """
    Get current reaction

    :param sensor_id: Sensor ID

    :return: Current reaction
    """
    sensor = models.Sensor.objects.get(id=sensor_id)

    if sensor.actual_reactions is not None:
        return sensor.actual_reactions
    else:
        return None


def set_current_reaction(sensor_id, reaction_ids):
    """
    Set current reactions for a sensor in the database.

    :param sensor_id: Sensor ID
    :param reaction_ids: List of Reaction IDs (or empty list)
    """

    sensor = models.Sensor.objects.get(id=sensor_id)

    if reaction_ids:
        reactions = models.Reaction.objects.filter(id__in=reaction_ids)
        reaction_names = [reaction.name for reaction in reactions]
        sensor.actual_reactions = reaction_names
        sensor.save()
    else:
        sensor.actual_reactions = []
        sensor.save()


def get_reactions_associated_reagent(reagent_id):
    """
    Get all reactions associated with a reagent and those where the reagent is used as the standard reagent

    :param reagent_id: Reagent ID

    :return: List of reactions
    """

    volume_to_adds = models.Step.objects.filter(pfiona_reagent_id=reagent_id)
    reaction_ids = set(vta.pfiona_reaction_id for vta in volume_to_adds)

    standard_reactions = models.Reaction.objects.filter(standard_id=reagent_id)
    standard_reaction_ids = set(reaction.id for reaction in standard_reactions)

    combined_reaction_ids = reaction_ids.union(standard_reaction_ids)

    reactions = list(models.Reaction.objects.filter(id__in=combined_reaction_ids))

    return reactions


def get_last_spectrum_all_type(reaction_name, timestamp):
    # Filtrer les types de spectre qui commencent par reaction_name et ne se terminent pas par "wavelength monitored"
    matching_spectrum_types = models.SpectrumType.objects.filter(
        type__startswith=reaction_name
    ).exclude(
        type__endswith="wavelength_monitored"
    )
    print(f"Matching spectrum types: {matching_spectrum_types}")

    # Dictionnaire pour stocker le dernier spectre de chaque type
    last_spectra = {}

    # Dictionnaire pour stocker les résultats complexes
    complex_results = {
        'wavelengths': [],
        'spectra': {}
    }

    # Initialisation pour collecter les wavelengths une seule fois
    wavelengths_collected = False

    # Parcourir chaque type de spectre trouvé
    for spectrum_type in matching_spectrum_types:
        # Trouver le dernier spectre pour ce type avant le timestamp donné
        last_spectrum = models.Spectrum.objects.filter(
            pfiona_spectrumtype=spectrum_type,
            pfiona_time__timestamp__lte=timestamp
        ).order_by('-pfiona_time__timestamp').first()  # Prendre le premier après tri décroissant par timestamp
        print(f"last_spectrum: {last_spectrum} for spectrum_type: {spectrum_type}")

        # Si un spectre est trouvé, procéder au stockage détaillé
        if last_spectrum:
            last_spectra[spectrum_type.type] = last_spectrum
            spectrum_details = {
                'Spectrum ID': last_spectrum.id,
                'Timestamp': last_spectrum.pfiona_time.timestamp,
                'Values': []
            }

            # Récupérer et stocker les valeurs associées à ce spectre
            associated_values = models.Value.objects.filter(pfiona_spectrum=last_spectrum).order_by('wavelength')
            for value in associated_values:
                spectrum_details['Values'].append(value.value)

                # Collecter les wavelengths une seule fois
                if not wavelengths_collected:
                    complex_results['wavelengths'].append(value.wavelength)

            # Après la première collection de wavelengths, éviter de les récolter à nouveau
            wavelengths_collected = True

            # Stocker les détails du spectre dans le dictionnaire de résultats complexes
            complex_results['spectra'][spectrum_type.type] = spectrum_details

    return complex_results


def get_reagent(reagent_id):
    return models.Reagent.objects.get(id=reagent_id)


def is_deployed(sensor_id):
    states = models.Sensor.objects.get(id=sensor_id).last_states
    states_tab = json.loads(states)
    return state_dict['Deployed'] in states_tab or state_dict['Stop_deploying_in_progress'] in states_tab

def is_stop_deploying_in_progress(sensor_id):
    states = models.Sensor.objects.get(id=sensor_id).last_states
    states_tab = json.loads(states)
    return state_dict['Stop_deploying_in_progress'] in states_tab


def is_sleeping(sensor_id):
    states = models.Sensor.objects.get(id=sensor_id).last_states
    states_tab = json.loads(states)
    return state_dict['Sleep'] in states_tab


def get_sensor_sleep(sensor_id):
    return models.Sensor.objects.get(id=sensor_id).sleep


def set_sensor_sleep(sensor_id, sleep):
    sensor = models.Sensor.objects.get(id=sensor_id)
    sensor.sleep = sleep
    sensor.save()


def get_sensor_sample_frequency(sensor_id):
    return models.Sensor.objects.get(id=sensor_id).sample_frequency


def set_sample_frequency(sensor_id, sample_frequency):
    sensor = models.Sensor.objects.get(id=sensor_id)
    sensor.sample_frequency = sample_frequency
    sensor.save()


def delete_all_wavelength_monitored(reaction_id):
    models.WavelengthMonitored.objects.filter(pfiona_reaction_id=reaction_id).delete()


def get_last_states(sensor_id):
    return models.Sensor.objects.get(id=sensor_id).last_states


def get_standard_concentration(reaction_name=None, reaction_id=None):
    try:
        if reaction_id is not None:
            reaction = models.Reaction.objects.get(id=reaction_id)
        elif reaction_name is not None:
            reaction = models.Reaction.objects.get(name=reaction_name)
        else:
            return None
        return reaction.standard_concentration
    except models.Reaction.DoesNotExist:
        return None


def get_reagents_for_current_reaction(sensor_id):
    """
    Get reagents for the current reaction

    :param sensor_id: Sensor ID
    :return: List of reagent names used in the current reactions, including standards
    """
    reaction_names = get_current_reaction(sensor_id)

    if not reaction_names:
        return []

    reagent_names = set()  # Using a set to avoid duplicates

    for reaction_name in reaction_names:
        reaction = models.Reaction.objects.filter(name=reaction_name).first()
        if reaction:
            # Include the standard reagent if it exists
            if reaction.standard:
                reagent_names.add(reaction.standard.name)

            steps = models.Step.objects.filter(pfiona_reaction=reaction)
            for step in steps:
                if step.pfiona_reagent:
                    reagent_names.add(step.pfiona_reagent.name)

    return list(reagent_names)


def get_3_last_spectrum_cycle_0(sensor_id):
    # Récupérer les trois derniers spectres pour ce capteur
    spectra = models.Spectrum.objects.filter(pfiona_sensor_id=sensor_id, cycle=0).order_by('-id')[:3]

    # Préparer les données de réponse
    response_data = []

    for spectrum in spectra:
        spectrum_data = {}
        spectrum_data['type'] = spectrum.pfiona_spectrumtype.type
        spectrum_data['values'] = list(
            models.Value.objects.filter(pfiona_spectrum=spectrum).order_by('wavelength').values('wavelength', 'value')
        )

        response_data.append(spectrum_data)

    return response_data
