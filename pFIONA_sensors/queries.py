import pFIONA_sensors.models as models
import json


def get_utils_reagents(sensor_id, return_json=False):

    """
    Get utils reagents from database (reagents excepted waste, sample, standard,...)

    :param sensor_id: Sensor ID
    :param return_json: Boolean, if true return json object

    :return: List of reagents
    """

    reagents = models.Reagent.objects.filter(sensor_id=sensor_id).filter(max_volume__gt=0)

    if return_json:

        reagents_data = [{
            'id': reagent.id,
            'name': reagent.name,
            'volume': reagent.volume,
            'max_volume': reagent.max_volume,
            'port': reagent.port,
            'sensor_id': reagent.sensor_id,
        } for reagent in reagents]

        reagents_json = json.dumps(reagents_data)

        return reagents_json

    else:

        return reagents

