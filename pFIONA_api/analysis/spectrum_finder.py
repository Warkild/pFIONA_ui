from collections import defaultdict
from datetime import datetime

import numpy as np
from django.db import transaction
from django.db.models import Max, Subquery, Avg, Q, When, Case, Prefetch
from django.db.models import F, Q, Min, Max, OuterRef, Subquery
from django.db.models.functions.text import Substr, Concat

from pFIONA_api.analysis.formula import absorbance, concentration
from pFIONA_api.queries import get_standard_concentration
from pFIONA_sensors.models import Sensor, Spectrum, SpectrumType, Time, Value, Reaction, WavelengthMonitored
from django.db.models import Min, Max


def get_cycle_count(timestamp, sensor_id):
    # Récupérer le dernier spectre avant le timestamp donné pour le capteur spécifié
    last_spectrum = Spectrum.objects.filter(pfiona_sensor_id=sensor_id, pfiona_time__timestamp__lt=timestamp).exclude(
        pfiona_spectrumtype__type__endswith='wavelength_monitored', cycle=0).order_by(
        '-pfiona_time__timestamp').first()

    if last_spectrum:
        deployment_id = last_spectrum.deployment

        # Compter le nombre de cycles associés au même déploiement
        cycles = Spectrum.objects.filter(deployment=deployment_id, cycle__gte=1).values_list('cycle',
                                                                                             flat=True).distinct()

        return cycles.count()
    else:
        return 0


from django.db.models import Min, Max, F, Q, Prefetch
from django.contrib.postgres.aggregates import ArrayAgg
from collections import defaultdict

from django.db.models import Min, Max, Q
from django.contrib.postgres.aggregates import ArrayAgg
from collections import defaultdict


def get_spectrums_in_cycle(timestamp, sensor_id, cycle):
    last_spectrum = Spectrum.objects.filter(
        pfiona_sensor_id=sensor_id,
        pfiona_time__timestamp__lt=timestamp
    ).order_by('-pfiona_time__timestamp').first()

    if not last_spectrum:
        return None, None, None

    deployment_id = last_spectrum.deployment

    times = Spectrum.objects.filter(
        deployment=deployment_id,
        pfiona_sensor_id=sensor_id,
        cycle__gte=1
    ).aggregate(
        deployment_start_time=Min('pfiona_time__timestamp'),
        deployment_end_time=Max('pfiona_time__timestamp'),
        cycle_start_time=Min('pfiona_time__timestamp', filter=Q(cycle=cycle)),
        cycle_end_time=Max('pfiona_time__timestamp', filter=Q(cycle=cycle))
    )

    deployment_start_time = times['deployment_start_time']
    deployment_end_time = times['deployment_end_time']
    cycle_start_time = times['cycle_start_time']
    cycle_end_time = times['cycle_end_time']

    spectrums = Spectrum.objects.filter(
        deployment=deployment_id,
        cycle=cycle
    ).exclude(
        pfiona_spectrumtype__type__icontains='wavelength_monitored'
    ).select_related(
        'pfiona_spectrumtype', 'pfiona_time'
    ).annotate(
        wavelengths=ArrayAgg('value__wavelength'),
        values=ArrayAgg('value__value')
    ).order_by('id')

    spectrums_data = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    wavelengths = []
    current_subcycle = defaultdict(lambda: defaultdict(int))

    for spectrum in spectrums:
        if not wavelengths:
            wavelengths = sorted(spectrum.wavelengths)  # Sort wavelengths

        # Sort values by the sorted order of wavelengths
        sorted_values = [value for _, value in sorted(zip(spectrum.wavelengths, spectrum.values))]

        spectrum_data = {
            'id': spectrum.id,
            'time': spectrum.pfiona_time.timestamp,
            'spectrumtype': spectrum.pfiona_spectrumtype.type,
            'cycle': spectrum.cycle,
            'deployment': spectrum.deployment,
            'values': list(zip(wavelengths, sorted_values))  # Use sorted wavelengths and corresponding values
        }

        spectrum_type = spectrum.pfiona_spectrumtype.type
        reaction_type = spectrum_type.split('_')[0]

        parts = spectrum_type.split('_')

        if 'Blank' in spectrum_type:
            key = 'Blank'
        elif 'Sample' in spectrum_type:
            key = 'Sample'
        elif 'CRM' in spectrum_type:
            key = 'CRM'
        elif 'Standard' in spectrum_type:
            if len(parts) >= 4 and parts[2] == 'Dillution':
                dilution = parts[3]
                key = f'Standard_Dillution_{dilution}'
            else:
                key = 'Standard'
        else:
            key = spectrum_type

        if key in spectrum_type and 'Dark' in spectrum_type and spectrums_data[reaction_type][key][
            current_subcycle[reaction_type][key]]:
            current_subcycle[reaction_type][key] += 1

        spectrums_data[reaction_type][key][current_subcycle[reaction_type][key]].append(spectrum_data)

    deployment_info = {
        'deployment_id': deployment_id,
        'deployment_start_time': deployment_start_time,
        'deployment_end_time': deployment_end_time,
        'cycle_start_time': cycle_start_time,
        'cycle_end_time': cycle_end_time,
    }

    return spectrums_data, wavelengths, deployment_info


from django.db.models import F, Q, Min, Max, OuterRef, Subquery
from collections import defaultdict


from django.db.models import Min, Max, Q
from django.contrib.postgres.aggregates import ArrayAgg
from collections import defaultdict

from django.db.models import Min, Max, F, Q
from django.contrib.postgres.aggregates import ArrayAgg
from collections import defaultdict

def get_spectrums_in_cycle_full_info(timestamp, sensor_id, cycle, wavelength_monitored=False):
    last_spectrum = Spectrum.objects.filter(
        pfiona_sensor_id=sensor_id,
        pfiona_time__timestamp__lt=timestamp,
        cycle__gte=1
    ).exclude(
        pfiona_spectrumtype__type__endswith='wavelength_monitored'
    ).order_by('-pfiona_time__timestamp').first()

    if not last_spectrum:
        return None, None, None

    deployment_id = last_spectrum.deployment

    times = Spectrum.objects.filter(
        deployment=deployment_id,
        pfiona_sensor_id=sensor_id,
        cycle__gte=1
    ).aggregate(
        deployment_start_time=Min('pfiona_time__timestamp'),
        deployment_end_time=Max('pfiona_time__timestamp'),
        cycle_start_time=Min('pfiona_time__timestamp', filter=Q(cycle=cycle)),
        cycle_end_time=Max('pfiona_time__timestamp', filter=Q(cycle=cycle))
    )

    deployment_start_time = times['deployment_start_time']
    deployment_end_time = times['deployment_end_time']
    cycle_start_time = times['cycle_start_time']
    cycle_end_time = times['cycle_end_time']

    if wavelength_monitored:
        spectrums = Spectrum.objects.filter(
            deployment=deployment_id,
            cycle=cycle,
            pfiona_sensor_id=sensor_id
        ).select_related(
            'pfiona_spectrumtype', 'pfiona_time'
        ).annotate(
            wavelengths=ArrayAgg('value__wavelength', ordering='value__wavelength'),
            values=ArrayAgg('value__value', ordering='value__wavelength')
        ).order_by('id')
    else:
        spectrums = Spectrum.objects.filter(
            deployment=deployment_id,
            cycle=cycle,
            pfiona_sensor_id=sensor_id
        ).exclude(
            pfiona_spectrumtype__type__endswith='wavelength_monitored'
        ).select_related(
            'pfiona_spectrumtype', 'pfiona_time'
        ).annotate(
            wavelengths=ArrayAgg('value__wavelength', ordering='value__wavelength'),
            values=ArrayAgg('value__value', ordering='value__wavelength')
        ).order_by('id')

    spectrums_data = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    wavelengths = []
    current_subcycle = defaultdict(lambda: defaultdict(int))

    for spectrum in spectrums:
        if not wavelengths:
            wavelengths = sorted(spectrum.wavelengths)  # Sort wavelengths

        # Sort values by the sorted order of wavelengths
        sorted_values = [value for _, value in sorted(zip(spectrum.wavelengths, spectrum.values))]

        spectrum_data = {
            'id': spectrum.id,
            'time': spectrum.pfiona_time.timestamp,
            'spectrumtype': spectrum.pfiona_spectrumtype.type,
            'cycle': spectrum.cycle,
            'deployment': spectrum.deployment,
            'values': list(zip(wavelengths, sorted_values))  # Use sorted wavelengths and corresponding values
        }

        spectrum_type = spectrum.pfiona_spectrumtype.type
        reaction_type = spectrum_type.split('_')[0]

        parts = spectrum_type.split('_')

        if 'Blank' in spectrum_type:
            key = 'Blank'
        elif 'Sample' in spectrum_type:
            key = 'Sample'
        elif 'CRM' in spectrum_type:
            key = 'CRM'
        elif 'Standard' in spectrum_type:
            if len(parts) >= 4 and parts[2] == 'Dillution':
                dilution = parts[3]
                key = f'Standard_Dillution_{dilution}'
            else:
                key = 'Standard'
        else:
            key = spectrum_type

        if key in spectrum_type and 'Dark' in spectrum_type and spectrums_data[reaction_type][key][current_subcycle[reaction_type][key]]:
            current_subcycle[reaction_type][key] += 1

        spectrums_data[reaction_type][key][current_subcycle[reaction_type][key]].append(spectrum_data)

    deployment_info = {
        'deployment_id': deployment_id,
        'deployment_start_time': deployment_start_time,
        'deployment_end_time': deployment_end_time,
        'cycle_start_time': cycle_start_time,
        'cycle_end_time': cycle_end_time,
    }

    return spectrums_data, wavelengths, deployment_info



def get_absorbance_spectrums_in_cycle(timestamp, sensor_id, cycle):
    spectrums, wavelengths, deployment_info = get_spectrums_in_cycle(timestamp, sensor_id, cycle)
    if not spectrums:
        return None, None, None

    absorbance_data = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

    for reaction, types in spectrums.items():
        for type_key, subcycles in types.items():
            for subcycle, spectrums_list in subcycles.items():
                ref_scan = [s['values'] for s in spectrums_list if 'Reference' in s['spectrumtype']]
                dark_scan = [s['values'] for s in spectrums_list if 'Dark' in s['spectrumtype']]
                sample_scan = [s['values'] for s in spectrums_list if
                               type_key in s['spectrumtype'] and 'Dark' not in s['spectrumtype'] and 'Reference' not in
                               s['spectrumtype'] and 'wavelength_monitored' not in s['spectrumtype']]

                if ref_scan and dark_scan and sample_scan:
                    ref_values = [v[1] for v in ref_scan[0]]
                    dark_values = [v[1] for v in dark_scan[0]]
                    sample_values = [v[1] for v in sample_scan[0]]

                    if len(ref_values) == len(dark_values) == len(sample_values):
                        absorbance_values = absorbance(ref_values, dark_values, sample_values)
                        absorbance_data[reaction][type_key][subcycle] = absorbance_values
                        deployment_info["time_"+str(reaction) + "_" + str(type_key) + "_subcycle_" + str(subcycle)] = [s['time'] for s in spectrums_list if
                               type_key in s['spectrumtype'] and 'Dark' not in s['spectrumtype'] and 'Reference' not in
                               s['spectrumtype'] and 'wavelength_monitored' not in s['spectrumtype']][0]
                    else:
                        print(
                            f"Skipping due to shape mismatch: ref={len(ref_values)}, dark={len(dark_values)}, sample={len(sample_values)}")

    # Convert defaultdict to dict to ensure JSON serialization
    absorbance_data = {k: dict(v) for k, v in absorbance_data.items()}
    for reaction, types in absorbance_data.items():
        absorbance_data[reaction] = {k: dict(v) for k, v in types.items()}

    return absorbance_data, wavelengths, deployment_info


def get_mean_absorbance_spectrums_in_cycle(timestamp, sensor_id, cycle):
    absorbance_data, wavelengths, deployment_info = get_absorbance_spectrums_in_cycle(timestamp, sensor_id, cycle)

    if not absorbance_data:
        return None, None, None

    mean_absorbance_data = defaultdict(lambda: defaultdict(list))

    for reaction, types in absorbance_data.items():
        for type_key, subcycles in types.items():
            all_subcycle_values = []

            for subcycle, values in subcycles.items():
                all_subcycle_values.append(values)

            if all_subcycle_values:
                mean_values = np.mean(all_subcycle_values, axis=0).tolist()
                mean_absorbance_data[reaction][type_key] = mean_values

    # Convert defaultdict to dict to ensure JSON serialization
    mean_absorbance_data = {k: dict(v) for k, v in mean_absorbance_data.items()}
    for reaction, types in mean_absorbance_data.items():
        mean_absorbance_data[reaction] = {k: v for k, v in types.items()}

    return mean_absorbance_data, wavelengths, deployment_info


def get_monitored_wavelength_values_in_cycle(timestamp, sensor_id, cycle):
    mean_absorbance_data, wavelengths, deployment_info = get_mean_absorbance_spectrums_in_cycle(timestamp, sensor_id,
                                                                                                cycle)

    if not mean_absorbance_data:
        return None

    monitored_wavelength_values = defaultdict(dict)

    for reaction, types in mean_absorbance_data.items():
        # Récupérer l'objet Reaction correspondant au nom de la réaction
        reaction_obj = Reaction.objects.get(name=reaction, standard__pfiona_sensor_id=sensor_id)

        # Récupérer toutes les longueurs d'onde surveillées pour cette réaction
        monitored_wavelengths = list(
            WavelengthMonitored.objects.filter(pfiona_reaction=reaction_obj).values_list('wavelength', flat=True))

        # Trier les longueurs d'onde surveillées par ordre croissant
        monitored_wavelengths.sort()

        # Trouver les indices des longueurs d'onde les plus proches
        for type_key, mean_values in types.items():
            wavelength_values = {}

            for mw in monitored_wavelengths:
                closest_index = (np.abs(np.array(wavelengths) - mw)).argmin()

                # Ajouter la valeur moyenne de l'absorbance à la longueur d'onde surveillée
                wavelength_values[mw] = mean_values[closest_index]

            if wavelength_values:
                monitored_wavelength_values[reaction][type_key] = dict(sorted(wavelength_values.items()))

    # Convert defaultdict to dict to ensure JSON serialization
    monitored_wavelength_values = {k: dict(v) for k, v in monitored_wavelength_values.items()}
    for reaction, types in monitored_wavelength_values.items():
        monitored_wavelength_values[reaction] = {k: dict(v) for k, v in types.items()}

    return monitored_wavelength_values, deployment_info


def get_monitored_wavelength_values_in_deployment(timestamp, sensor_id):
    # Obtenir le nombre de cycles pour le déploiement
    total_cycles = get_cycle_count(timestamp, sensor_id)

    all_monitored_wavelength_values = defaultdict(lambda: defaultdict(lambda: defaultdict(dict)))
    deployment_info = None

    for cycle in range(1, total_cycles + 1):
        monitored_wavelength_values, deployment_info = get_monitored_wavelength_values_in_cycle(timestamp, sensor_id,
                                                                                                cycle)

        if monitored_wavelength_values:
            # Extraire les temps de début et de fin de cycle
            cycle_start_time = deployment_info.get('cycle_start_time')
            cycle_end_time = deployment_info.get('cycle_end_time')

            for reaction, types in monitored_wavelength_values.items():
                if cycle not in all_monitored_wavelength_values[reaction]:
                    all_monitored_wavelength_values[reaction][cycle] = defaultdict(dict)

                # Ajouter les temps de début et de fin de cycle
                all_monitored_wavelength_values[reaction][cycle]['cycle_start_time'] = cycle_start_time
                all_monitored_wavelength_values[reaction][cycle]['cycle_end_time'] = cycle_end_time

                for type_key, wavelength_values in types.items():
                    if type_key not in all_monitored_wavelength_values[reaction][cycle]:
                        all_monitored_wavelength_values[reaction][cycle][type_key] = {}
                    for wavelength, value in wavelength_values.items():
                        all_monitored_wavelength_values[reaction][cycle][type_key][wavelength] = value

    # Convertir defaultdict en dict pour assurer la sérialisation JSON
    all_monitored_wavelength_values = {reaction: {
        cycle: {type_key: dict(wavelength_values) if isinstance(wavelength_values, defaultdict) else wavelength_values
                for type_key, wavelength_values in types.items()} for cycle, types in cycles.items()} for
        reaction, cycles in all_monitored_wavelength_values.items()}

    if deployment_info['cycle_start_time']:
        deployment_info.pop('cycle_start_time', None)
    if deployment_info['cycle_end_time']:
        deployment_info.pop('cycle_end_time', None)

    return all_monitored_wavelength_values, deployment_info


def get_concentration_in_deployment(timestamp, sensor_id):

    # Récupérer le nombre de cycles
    cycle_count = get_cycle_count(timestamp, sensor_id)

    if cycle_count == 0:
        return None, None

    monitored_wavelength_values, deployment_info = get_monitored_wavelength_values_in_deployment(timestamp, sensor_id)
    concentrations = defaultdict(lambda: defaultdict(lambda: defaultdict(dict)))

    for reaction, cycles in monitored_wavelength_values.items():
        std_conc = get_standard_concentration(reaction_name=reaction, sensor_id=sensor_id)
        for cycle, types in cycles.items():
            cycle_start_time = types.get('cycle_start_time')
            cycle_end_time = types.get('cycle_end_time')
            abs_blank = types.get('Blank', {})
            abs_sample = types.get('Sample', {})
            abs_standard = types.get('Standard', {})

            wavelengths = sorted(list(abs_sample.keys()))
            if wavelengths:
                reference_wavelength = wavelengths[-1]

            if any(key.startswith('Standard_Dillution') for key in types.keys()):
                # Handle the case with standard dilutions
                standard_dilution_data = {key: types[key] for key in types.keys() if
                                          key.startswith('Standard_Dillution')}
                for wavelength in wavelengths[:-1]:
                    # Collect the dilution levels and corresponding absorbance values
                    dilution_levels = []
                    absorbance_values = []

                    for dilution, absorbances in standard_dilution_data.items():
                        if wavelength in absorbances:
                            dilution_level = int(dilution.split('_')[-1]) * 0.25 * std_conc
                            absorbance_value = absorbances[wavelength]
                            dilution_levels.append(dilution_level)
                            absorbance_values.append(absorbance_value)

                    # Calculate the linear regression
                    slope, intercept = np.polyfit(dilution_levels, absorbance_values, 1)

                    if wavelength in abs_sample:
                        sample_absorbance = abs_sample[wavelength]
                        sample_concentration = (sample_absorbance - intercept) / slope
                        concentrations[reaction][cycle]['concentration'][wavelength] = sample_concentration

            else:
                # Handle the regular case with blank/sample/standard or find last standard dillution
                for wavelength in wavelengths[:-1]:
                    if wavelength in abs_blank and reference_wavelength in abs_blank and wavelength in abs_standard and reference_wavelength in abs_standard:
                        # Regular case with blank/sample/standard
                        abs_sample_val = abs_sample[wavelength] - abs_sample[reference_wavelength]
                        abs_blank_val = abs_blank[wavelength] - abs_blank[reference_wavelength]
                        abs_standard_val = abs_standard[wavelength] - abs_standard[reference_wavelength]

                        conc = concentration(abs_sample_val, abs_blank_val, abs_standard_val, std_conc)
                        concentrations[reaction][cycle]['concentration'][wavelength] = conc

                    else:
                        # Find the last cycle with standard dillutions
                        last_standard_dillution_data = get_last_standard_dillution(reaction, cycle, wavelength,
                                                                                   monitored_wavelength_values,
                                                                                   sensor_id)
                        if last_standard_dillution_data:
                            dilution_levels, absorbance_values = last_standard_dillution_data
                            slope, intercept = np.polyfit(dilution_levels, absorbance_values, 1)

                            if wavelength in abs_sample:
                                sample_absorbance = abs_sample[wavelength]
                                sample_concentration = (sample_absorbance - intercept) / slope
                                concentrations[reaction][cycle]['concentration'][wavelength] = sample_concentration

            # Store cycle start and end times
            concentrations[reaction][cycle]['cycle_start_time'] = cycle_start_time
            concentrations[reaction][cycle]['cycle_end_time'] = cycle_end_time

    # Convert defaultdict to dict to ensure JSON serialization
    concentrations = {reaction: {
        cycle: {type_key: dict(wavelength_values) if isinstance(wavelength_values, defaultdict) else wavelength_values
                for type_key, wavelength_values in types.items()} for cycle, types in cycles.items()} for
        reaction, cycles in concentrations.items()}

    return concentrations, deployment_info


def get_last_standard_dillution(reaction, cycle, wavelength, monitored_wavelength_values, sensor_id):
    cycles = sorted(monitored_wavelength_values[reaction].keys())
    cycle_index = cycles.index(cycle)

    for i in range(cycle_index - 1, -1, -1):
        previous_cycle = cycles[i]
        if any(key.startswith('Standard_Dillution') for key in
               monitored_wavelength_values[reaction][previous_cycle].keys()):
            standard_dilution_data = {key: monitored_wavelength_values[reaction][previous_cycle][key] for key in
                                      monitored_wavelength_values[reaction][previous_cycle].keys() if
                                      key.startswith('Standard_Dillution')}

            if wavelength in list(standard_dilution_data.values())[0].keys():
                dilution_levels = []
                absorbance_values = []

                for dilution, absorbances in standard_dilution_data.items():
                    if wavelength in absorbances:
                        dilution_level = int(dilution.split('_')[-1]) * 0.25 * get_standard_concentration(
                            reaction_name=reaction, sensor_id=sensor_id)
                        dilution_levels.append(dilution_level)
                        absorbance_values.append(absorbances[wavelength])

                return dilution_levels, absorbance_values

    return None


def get_deployment_list(sensor_id):
    deployment_list = Spectrum.objects.filter(pfiona_sensor_id=sensor_id, cycle__gte=1).values('deployment').annotate(
        start_time=Min('pfiona_time__timestamp'),
        end_time=Max('pfiona_time__timestamp')
    ).order_by('deployment')

    return list(deployment_list)


def get_spectrums_in_deployment_full_info(timestamp, sensor_id, wavelength_monitored=False):
    # Récupérer le nombre de cycles
    cycle_count = get_cycle_count(timestamp, sensor_id)

    if cycle_count == 0:
        return None, None, None

    all_spectrums_data = defaultdict(lambda: defaultdict(dict))
    all_wavelengths = []
    deployment_info = None

    for cycle in range(1, cycle_count + 1):
        spectrums_data, wavelengths, cycle_deployment_info = get_spectrums_in_cycle_full_info(timestamp, sensor_id,
                                                                                              cycle,
                                                                                              wavelength_monitored=wavelength_monitored)

        if spectrums_data:
            all_spectrums_data[cycle] = spectrums_data

        if wavelengths:
            if not all_wavelengths:
                all_wavelengths = wavelengths

        if not deployment_info and cycle_deployment_info:
            deployment_info = cycle_deployment_info

    return all_spectrums_data, all_wavelengths, deployment_info


def delete_spectrums_by_deployment(sensor_id, deployment_id):
    """
    Deletes all spectrums belonging to a specific deployment for a given sensor_id.
    """
    try:
        # Use a transaction to ensure atomicity of the delete operation
        with transaction.atomic():
            Spectrum.objects.filter(pfiona_sensor_id=sensor_id, deployment=deployment_id).delete()
            print(
                f"All spectrums for sensor_id {sensor_id} and deployment {deployment_id} have been successfully deleted.")
    except Exception as e:
        # Print an error message if something goes wrong
        print(f"An error occurred while deleting spectrums: {e}")


def get_absorbance_spectrums_in_cycle_full_info(timestamp, sensor_id, cycle):
    spectrums, wavelengths, deployment_info = get_spectrums_in_cycle_full_info(timestamp, sensor_id, cycle)
    if not spectrums:
        return None, None, None

    absorbance_data = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

    for reaction, types in spectrums.items():
        for type_key, subcycles in types.items():
            for subcycle, spectrums_list in subcycles.items():
                ref_scan = [s['values'] for s in spectrums_list if 'Reference' in s['spectrumtype']]
                dark_scan = [s['values'] for s in spectrums_list if 'Dark' in s['spectrumtype']]
                sample_scan = [s['values'] for s in spectrums_list if
                               type_key in s['spectrumtype'] and 'Dark' not in s['spectrumtype'] and 'Reference' not in
                               s['spectrumtype'] and 'wavelength_monitored' not in s['spectrumtype']]

                if ref_scan and dark_scan and sample_scan:
                    ref_values = [v[1] for v in ref_scan[0]]
                    dark_values = [v[1] for v in dark_scan[0]]
                    sample_values = [v[1] for v in sample_scan[0]]

                    if len(ref_values) == len(dark_values) == len(sample_values):
                        absorbance_values = absorbance(ref_values, dark_values, sample_values)
                        absorbance_data[reaction][type_key][subcycle] = absorbance_values
                    else:
                        print(
                            f"Skipping due to shape mismatch: ref={len(ref_values)}, dark={len(dark_values)}, sample={len(sample_values)}")

    # Convert defaultdict to dict to ensure JSON serialization
    absorbance_data = {k: dict(v) for k, v in absorbance_data.items()}
    for reaction, types in absorbance_data.items():
        absorbance_data[reaction] = {k: dict(v) for k, v in types.items()}

    return absorbance_data, wavelengths, deployment_info


def get_absorbance_spectrums_in_deployment_full_info(timestamp, sensor_id):
    # Récupérer le nombre de cycles
    cycle_count = get_cycle_count(timestamp, sensor_id)

    if cycle_count == 0:
        return None, None, None

    all_absorbance_data = defaultdict(lambda: defaultdict(dict))
    all_wavelengths = []
    deployment_info = None

    for cycle in range(1, cycle_count + 1):
        absorbance_data, wavelengths, cycle_deployment_info = get_absorbance_spectrums_in_cycle_full_info(timestamp,
                                                                                                          sensor_id,
                                                                                                          cycle)

        if absorbance_data:
            all_absorbance_data[cycle] = absorbance_data

        if wavelengths:
            if not all_wavelengths:
                all_wavelengths = wavelengths

        if not deployment_info and cycle_deployment_info:
            deployment_info = cycle_deployment_info

    return all_absorbance_data, all_wavelengths, deployment_info
