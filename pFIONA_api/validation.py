import json
import re
import ast

from django.contrib.auth.decorators import login_required
from django.core.exceptions import ValidationError
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

import pFIONA_api.queries as q


def validate_reaction_data(data):
    # Validation of data
    if data['name'] == "":
        raise ValidationError('Name cannot be empty')

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
            reagent_id.append(step[0])
        else:
            # Nothing selected
            raise ValidationError('Step cannot be empty')

    if len(reagent_id) == 0:
        raise ValidationError('You must specify at least one reagent')

    if data['standard_reagent_id'] == "":
        raise ValidationError('Standard reagent cannot be empty')

    if float(data["standard_concentration"]) <= 0:
        raise ValidationError('Standard concentration cannot be negative')

    if float(data["volume_of_mixture"]) <= 0:
        raise ValidationError('Volume of mixture cannot be negative')

    if float(data["volume_to_push_to_flow_cell"]) <= 0:
        raise ValidationError('Volume of flow cell cannot be negative')

    if float(data["volume_of_mixture"]) < float(data["volume_to_push_to_flow_cell"]):
        raise ValidationError('Volume of mixture must be greater than volume of flow cell')

    if data['monitored_wavelength'] == "":
        raise ValidationError('Monitored wavelength cannot be empty')

    if not bool(re.compile(r'^[0-9;]*$').match(data['monitored_wavelength'])):
        raise ValidationError('Unknown monitored wavelength format')

    if data['number_of_blank'] == "":
        raise ValidationError('Number of blank cannot be empty')

    if int(data['number_of_blank']) < 1:
        raise ValidationError('Number of blank must be at least 1')

    if data['number_of_sample'] == "":
        raise ValidationError('Number of sample cannot be empty')

    if int(data['number_of_sample']) < 1:
        raise ValidationError('Number of sample must be at least 1')

    if data['number_of_standard'] == "":
        raise ValidationError('Number of standard cannot be empty')

    if int(data['number_of_standard']) < 1:
        raise ValidationError('Number of standard must be at least 1')

    if data['multi_standard_time'] == "":
        raise ValidationError('Multi standard cannot be empty')

    if int(data['multi_standard_time']) < 0:
        raise ValidationError('Multi standard must be at least 0')

    if int(data['reaction_time']) < 0:
        raise ValidationError('Reaction time must be at least 0')

    if data['crm_time'] == "":
        raise ValidationError('CRM time cannot be empty')

    if int(data['crm_time']) < 0:
        raise ValidationError('CRM time must be at least 0')

    return True  # If all validations pass, return True
