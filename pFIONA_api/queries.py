from django.db.models import Q

import pFIONA_sensors.models as models
import json

state_dict = {'Boot': 0,
              'Flush': 1,
              'Mix': 2,
              'Change_Valve': 3,
              'Scan': 4,
              'Pump_Sample_from_ocean': 5,
              'Push_to_flow_cell': 6,
              'Dilution': 7,
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
              'Error': 18,
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


def create_reaction(name, standard_id, standard_concentration, volume_of_mixture, volume_to_push_to_flow_cell):
    """
    Create a reaction in database

    :param name: Name of reaction
    :param standard_id: Standard ID of reaction
    :param standard_concentration: Standard concentration of reaction
    :param volume_of_mixture: Volume of mixture of reaction
    :param volume_to_push_to_flow_cell: Volume to push to flow cell of reaction

    :return: Reaction object
    """

    standard = models.Reagent.objects.get(id=standard_id)

    reaction = models.Reaction.objects.create(name=name, standard_concentration=standard_concentration,
                                              standard=standard, volume_of_mixture=volume_of_mixture,
                                              volume_to_push_to_flow_cell=volume_to_push_to_flow_cell)

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
    step = models.Step.objects.create(pfiona_reagent_id=reagent_id, pfiona_reaction_id=reaction_id,
                                      number=number,
                                      order=order)
    step.save()

    return step


def create_monitored_wavelength(reaction_id, wavelength):
    monitored_wavelength = models.WavelengthMonitored.objects.create(pfiona_reaction_id=reaction_id,
                                                                     wavelength=wavelength)
    monitored_wavelength.save()

    return monitored_wavelength


def get_reaction_details(reaction_id):
    """
    Get reaction details with the reaction and step details

    :param reaction_id: Reaction ID

    :return: JSON Object (Reaction details)
    """

    # Get the reaction basic details

    reaction = models.Reaction.objects.filter(id=reaction_id).get()

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
        'monitored_wavelengths': monitored_wavelengths
    })

    return reaction_json


def delete_all_step(reaction_id):
    """
    Delete all step object in database associated with a specific reaction id

    :param reaction_id: Reaction ID
    """

    models.Step.objects.filter(pfiona_reaction_id=reaction_id).delete()


def update_reaction(reaction_id, name, standard_id, standard_concentration, volume_of_mixture,
                    volume_to_push_to_flow_cell):
    """
    Update a reaction in database

    :param reaction_id: Reaction ID
    :param name: Name of reaction
    :param standard_id: Standard ID of reaction
    :param standard_concentration: Standard concentration of reaction
    :param volume_of_mixture: Volume of mixture of reaction
    :param volume_to_push_to_flow_cell: Volume to push to flow cell of reaction

    :return: Reaction object
    """

    reaction = models.Reaction.objects.get(id=reaction_id)
    reaction.name = name
    reaction.standard_concentration = standard_concentration
    reaction.standard_id = standard_id
    reaction.volume_of_mixture = volume_of_mixture
    reaction.volume_to_push_to_flow_cell = volume_to_push_to_flow_cell
    reaction.save()

    return reaction


def get_current_reaction(sensor_id):
    """
    Get current reaction

    :param sensor_id: Sensor ID

    :return: Current reaction
    """
    sensor = models.Sensor.objects.get(id=sensor_id)

    if sensor.actual_reaction is not None:
        return sensor.actual_reaction
    else:
        return None


def set_current_reaction(sensor_id, reaction_id):
    """
    Set current reaction for a sensor in database

    :param sensor_id: Sensor ID
    :param reaction_id: Reaction ID (or None)
    """

    sensor = models.Sensor.objects.get(id=sensor_id)

    if reaction_id is not None:
        reaction = models.Reaction.objects.get(id=reaction_id)
        sensor.actual_reaction = reaction
        sensor.save()
    else:
        sensor.actual_reaction = None
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
            associated_values = models.Value.objects.filter(pfiona_spectrum=last_spectrum)
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
    return state_dict['Deployed'] in states_tab


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
