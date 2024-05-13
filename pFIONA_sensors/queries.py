from django.db.models import Q

import pFIONA_sensors.models as models
import json


def get_utils_reagents(sensor_id, return_json=False):
    """
    Get utils reagents from database (reagents excepted waste, sample,...)

    :param sensor_id: Sensor ID
    :param return_json: Boolean, if true return json object

    :return: List of reagents
    """

    reagents = models.Reagent.objects.filter(sensor_id=sensor_id).filter(Q(max_volume__gt=0))

    if return_json:

        reagents_data = [{
            'id': reagent.id,
            'name': reagent.name,
            'volume': reagent.volume,
            'max_volume': reagent.max_volume,
            'port': reagent.port,
            'sensor_id': reagent.sensor_id,
            'is_standard': bool(reagent.is_standard),
        } for reagent in reagents]

        reagents_json = json.dumps(reagents_data)

        return reagents_json

    else:

        return reagents


def create_reaction(name, wait_time, standard_id, standard_concentration):
    """
    Create a reaction in database

    :param name: Name of reaction
    :param wait_time: Wait time of reaction
    :param standard_id: Standard ID of reaction
    :param standard_concentration: Standard concentration of reaction

    :return: Reaction object
    """

    print(f"Add {name}, {wait_time}, {standard_id}, {standard_concentration}")

    standard = models.Reagent.objects.get(id=standard_id)

    print(f"Find standard {standard}")

    reaction = models.Reaction.objects.create(name=name, wait=wait_time, standard_concentration=standard_concentration,
                                              standard=standard)

    print(f"Reaction created: {reaction}")

    reaction.save()

    print("Reaction saved")

    return reaction


def create_volumetoadd(reagent_id, reaction_id, volume, order):
    """
    Create a volumetoadd object in database

    :param reagent_id: Reagent ID
    :param reaction_id: Reaction ID
    :param volume: Volume to add
    :param order: Order of the action in reaction

    :return: Volumetoadd object
    """
    volumetoadd = models.VolumeToAdd.objects.create(reagent_id=reagent_id, reaction_id=reaction_id, volume=volume,
                                                    order=order)
    volumetoadd.save()

    return volumetoadd


def get_reaction_details(reaction_id):
    """
    Get reaction details with the reaction and volumetoadd details

    :param reaction_id: Reaction ID

    :return: JSON Object (Reaction details)
    """

    # Get the reaction basic details

    reaction = models.Reaction.objects.filter(id=reaction_id).get()

    # Get the volumetoadd to have the full reaction details

    volumetoadd_list = models.VolumeToAdd.objects.filter(reaction=reaction.id).order_by('order')

    volumetoadd_json = [{
        'reagent_id': volumetoadd.reagent_id,
        'volume': volumetoadd.volume
    } for volumetoadd in volumetoadd_list]

    # Create an object with all the information about the reaction

    reaction_json = json.dumps({
        'id': reaction.id,
        'name': reaction.name,
        'wait': reaction.wait,
        'standard_id': reaction.standard.id,
        'standard_concentration': reaction.standard_concentration,
        'actions': volumetoadd_json
    })

    return reaction_json


def delete_all_volumetoadd(reaction_id):
    """
    Delete all volumetoadd object in database associated with a specific reaction id

    :param reaction_id: Reaction ID
    """

    models.VolumeToAdd.objects.filter(reaction_id=reaction_id).delete()


def update_reaction(reaction_id, name, wait_time, standard_id, standard_concentration):
    """
    Update a reaction in database

    :param reaction_id: Reaction ID
    :param name: Name of reaction
    :param wait_time: Wait time of reaction
    :param standard_id: Standard ID of reaction
    :param standard_concentration: Standard concentration of reaction

    :return: Reaction object
    """

    reaction = models.Reaction.objects.get(id=reaction_id)
    reaction.name = name
    reaction.wait = wait_time
    reaction.standard_concentration = standard_concentration
    reaction.standard_id = standard_id
    reaction.save()

    return reaction


def get_current_reaction_id(sensor_id):
    """
    Get current reaction ID

    :param sensor_id: Sensor ID

    :return: Current reaction ID
    """
    sensor = models.Sensor.objects.get(id=sensor_id)

    if sensor.actual_reaction is not None:
        return sensor.actual_reaction.id
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
