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

    reaction = models.Reaction.objects.create(name=name, wait=wait_time, standard_concentration=standard_concentration, standard=standard)

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
