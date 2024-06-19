from collections import defaultdict

import numpy as np
from django.db.models import Max, Subquery, Avg, Q
from pFIONA_api.analysis.formula import absorbance, concentration
from pFIONA_api.queries import get_standard_concentration
from pFIONA_sensors.models import Sensor, Spectrum, SpectrumType, Time, Value, Reaction, WavelengthMonitored
from django.db.models import Min, Max


def get_cycle_count(timestamp, sensor_id):
    # Récupérer le dernier spectre avant le timestamp donné pour le capteur spécifié
    last_spectrum = Spectrum.objects.filter(pfiona_sensor_id=sensor_id, pfiona_time__timestamp__lt=timestamp).order_by(
        '-pfiona_time__timestamp').first()

    if last_spectrum:
        deployment_id = last_spectrum.deployment

        # Compter le nombre de cycles associés au même déploiement
        cycles = Spectrum.objects.filter(deployment=deployment_id, cycle__gte=1).values_list('cycle', flat=True).distinct()

        return cycles.count()
    else:
        return 0


def get_spectrums_in_cycle(timestamp, sensor_id, cycle):
    # Retrieve the last spectrum before the given timestamp for the specified sensor
    last_spectrum = Spectrum.objects.filter(pfiona_sensor_id=sensor_id, pfiona_time__timestamp__lt=timestamp) \
        .order_by('-pfiona_time__timestamp') \
        .first()

    if not last_spectrum:
        return None, None, None

    deployment_id = last_spectrum.deployment

    # Retrieve the start and end timestamps of the deployment and cycle in a single query
    times = Spectrum.objects.filter(deployment=deployment_id) \
        .aggregate(
        deployment_start_time=Min('pfiona_time__timestamp'),
        deployment_end_time=Max('pfiona_time__timestamp'),
        cycle_start_time=Min('pfiona_time__timestamp', filter=Q(cycle=cycle)),
        cycle_end_time=Max('pfiona_time__timestamp', filter=Q(cycle=cycle))
    )

    # Extract the time values
    deployment_start_time = times['deployment_start_time']
    deployment_end_time = times['deployment_end_time']
    cycle_start_time = times['cycle_start_time']
    cycle_end_time = times['cycle_end_time']

    # Retrieve all spectrums associated with the same deployment and cycle, excluding those with 'wavelength_monitored' in their type
    spectrums = Spectrum.objects.filter(deployment=deployment_id, cycle=cycle) \
        .exclude(pfiona_spectrumtype__type__icontains='wavelength_monitored') \
        .select_related('pfiona_spectrumtype') \
        .prefetch_related('value_set') \
        .order_by('id')

    spectrums_data = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    wavelengths = []
    current_subcycle = defaultdict(lambda: defaultdict(int))

    for spectrum in spectrums:
        # Retrieve the values associated with this spectrum
        values = list(spectrum.value_set.values('wavelength', 'value').order_by('wavelength'))
        if not wavelengths:
            wavelengths = [v['wavelength'] for v in values]  # Collect wavelengths once

        spectrum_data = {
            'id': spectrum.id,
            'time': spectrum.pfiona_time.timestamp,
            'spectrumtype': spectrum.pfiona_spectrumtype.type,
            'cycle': spectrum.cycle,
            'deployment': spectrum.deployment,
            'values': values,
        }
        spectrum_type = spectrum.pfiona_spectrumtype.type
        reaction_type = spectrum_type.split('_')[0]

        key = 'Blank' if 'Blank' in spectrum_type else 'Sample' if 'Sample' in spectrum_type else 'Standard'
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


from collections import defaultdict
from django.db.models import Min, Max, Q


def get_spectrums_in_cycle_full_info(timestamp, sensor_id, cycle):
    # Retrieve the last spectrum before the given timestamp for the specified sensor
    last_spectrum = Spectrum.objects.filter(pfiona_sensor_id=sensor_id, pfiona_time__timestamp__lt=timestamp).order_by(
        '-pfiona_time__timestamp').first()

    if not last_spectrum:
        return None, None, None

    deployment_id = last_spectrum.deployment

    # Retrieve the start and end timestamps of the deployment and cycle in a single query
    times = Spectrum.objects.filter(deployment=deployment_id).aggregate(
        deployment_start_time=Min('pfiona_time__timestamp'),
        deployment_end_time=Max('pfiona_time__timestamp'),
        cycle_start_time=Min('pfiona_time__timestamp', filter=Q(cycle=cycle)),
        cycle_end_time=Max('pfiona_time__timestamp', filter=Q(cycle=cycle))
    )

    # Extract the time values
    deployment_start_time = times['deployment_start_time']
    deployment_end_time = times['deployment_end_time']
    cycle_start_time = times['cycle_start_time']
    cycle_end_time = times['cycle_end_time']

    # Retrieve all spectrums associated with the same deployment and cycle, excluding 'wavelength_monitored'
    spectrums = Spectrum.objects.filter(deployment=deployment_id, cycle=cycle).select_related(
        'pfiona_spectrumtype').prefetch_related('value_set').order_by('id')

    spectrums_data = defaultdict(lambda: defaultdict(list))
    wavelengths = []

    for spectrum in spectrums:
        if spectrum.pfiona_spectrumtype.type.endswith('wavelength_monitored'):
            continue

        values = list(spectrum.value_set.values('wavelength', 'value').order_by('wavelength'))
        if not wavelengths:
            wavelengths = [v['wavelength'] for v in values]

        spectrum_data = {
            'id': spectrum.id,
            'time': spectrum.pfiona_time.timestamp,
            'spectrumtype': spectrum.pfiona_spectrumtype.type,
            'cycle': spectrum.cycle,
            'deployment': spectrum.deployment,
            'values': values,
        }

        spectrum_type = spectrum.pfiona_spectrumtype.type
        parts = spectrum_type.split('_')

        if 'Blank' in spectrum_type:
            key = 'Blank'
        elif 'Sample' in spectrum_type:
            key = 'Sample'
        elif 'Standard' in spectrum_type:
            if len(parts) >= 4 and parts[2] == 'Dillution':
                dilution = parts[3]
                key = f'Standard_Dillution_{dilution}'
            else:
                key = 'Standard'
        else:
            key = spectrum_type

        spectrums_data[parts[0]][key].append(spectrum_data)

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
                    ref_values = [v['value'] for v in ref_scan[0]]
                    dark_values = [v['value'] for v in dark_scan[0]]
                    sample_values = [v['value'] for v in sample_scan[0]]

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


def get_monitored_wavelength_values(timestamp, sensor_id, cycle):
    mean_absorbance_data, wavelengths, deployment_info = get_mean_absorbance_spectrums_in_cycle(timestamp, sensor_id,
                                                                                                cycle)

    if not mean_absorbance_data:
        return None

    monitored_wavelength_values = defaultdict(dict)

    for reaction, types in mean_absorbance_data.items():
        # Récupérer l'objet Reaction correspondant au nom de la réaction
        reaction_obj = Reaction.objects.get(name=reaction)

        # Récupérer toutes les longueurs d'onde surveillées pour cette réaction
        monitored_wavelengths = list(
            WavelengthMonitored.objects.filter(pfiona_reaction=reaction_obj).values_list('wavelength', flat=True))

        # Trier les longueurs d'onde surveillées par ordre croissant
        monitored_wavelengths.sort()

        print(f"Monitored wavelengths for {reaction}: {monitored_wavelengths}")

        # Trouver les indices des longueurs d'onde les plus proches
        for type_key, mean_values in types.items():
            wavelength_values = {}

            for mw in monitored_wavelengths:
                closest_index = (np.abs(np.array(wavelengths) - mw)).argmin()
                print(f"Closest index for monitored wavelength {mw} in {reaction}: {closest_index}")

                # Ajouter la valeur moyenne de l'absorbance à la longueur d'onde surveillée
                wavelength_values[mw] = mean_values[closest_index]

            if wavelength_values:
                monitored_wavelength_values[reaction][type_key] = dict(sorted(wavelength_values.items()))

    print(f"Final monitored wavelength values: {monitored_wavelength_values}")

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
        monitored_wavelength_values, deployment_info = get_monitored_wavelength_values(timestamp, sensor_id, cycle)

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

    return all_monitored_wavelength_values, deployment_info

def get_monitored_wavelength_values_absorbance_substraction(timestamp, sensor_id):
    # Obtenir le nombre de cycles pour le déploiement
    total_cycles = get_cycle_count(timestamp, sensor_id)

    print(f"total_cycles : {total_cycles}")

    all_monitored_wavelength_values = defaultdict(lambda: defaultdict(lambda: defaultdict(dict)))
    deployment_info = None

    for cycle in range(1, total_cycles + 1):
        monitored_wavelength_values, deployment_info = get_monitored_wavelength_values(timestamp, sensor_id, cycle)

        if monitored_wavelength_values:
            # Extraire les temps de début et de fin de cycle
            cycle_start_time = deployment_info.pop('cycle_start_time', None)
            cycle_end_time = deployment_info.pop('cycle_end_time', None)

            for reaction, types in monitored_wavelength_values.items():
                if cycle not in all_monitored_wavelength_values[reaction]:
                    all_monitored_wavelength_values[reaction][cycle] = defaultdict(dict)

                # Ajouter les temps de début et de fin de cycle
                all_monitored_wavelength_values[reaction][cycle]['cycle_start_time'] = cycle_start_time
                all_monitored_wavelength_values[reaction][cycle]['cycle_end_time'] = cycle_end_time

                for type_key, wavelength_values in types.items():
                    wavelengths = sorted(wavelength_values.keys())
                    if len(wavelengths) > 1:
                        # Garder la dernière longueur d'onde
                        last_wavelength = wavelengths[-1]
                        last_value = wavelength_values[last_wavelength]

                        # Faire la soustraction pour toutes les autres longueurs d'onde
                        for wavelength in wavelengths[:-1]:
                            if type_key not in all_monitored_wavelength_values[reaction][cycle]:
                                all_monitored_wavelength_values[reaction][cycle][type_key] = {}
                            subtracted_value = wavelength_values[wavelength] - last_value
                            all_monitored_wavelength_values[reaction][cycle][type_key][wavelength] = subtracted_value

    # Convertir defaultdict en dict pour assurer la sérialisation JSON
    all_monitored_wavelength_values = {reaction: {
        cycle: {type_key: dict(wavelength_values) if isinstance(wavelength_values, defaultdict) else wavelength_values
                for type_key, wavelength_values in types.items()} for cycle, types in cycles.items()} for
        reaction, cycles in all_monitored_wavelength_values.items()}

    return all_monitored_wavelength_values, deployment_info


def calculate_concentration_for_deployment(timestamp, sensor_id):
    monitored_wavelength_values, deployment_info = get_monitored_wavelength_values_absorbance_substraction(timestamp, sensor_id)

    concentrations = defaultdict(lambda: defaultdict(lambda: defaultdict(dict)))

    for reaction, cycles in monitored_wavelength_values.items():
        std_conc = get_standard_concentration(reaction_name=reaction)
        for cycle, types in cycles.items():
            cycle_start_time = types.get('cycle_start_time')
            cycle_end_time = types.get('cycle_end_time')
            abs_blank = types.get('Blank', {})
            abs_sample = types.get('Sample', {})
            abs_standard = types.get('Standard', {})

            for wavelength in abs_sample.keys():
                if wavelength in abs_blank and wavelength in abs_standard:
                    abs_sample_val = abs_sample[wavelength]
                    abs_blank_val = abs_blank[wavelength]
                    abs_standard_val = abs_standard[wavelength]

                    conc = concentration(abs_sample_val, abs_blank_val, abs_standard_val, std_conc)
                    concentrations[reaction][cycle]['concentration'][wavelength] = conc
                    concentrations[reaction][cycle]['cycle_start_time'] = cycle_start_time
                    concentrations[reaction][cycle]['cycle_end_time'] = cycle_end_time

    # Convertir defaultdict en dict pour assurer la sérialisation JSON
    concentrations = {reaction: {
        cycle: {type_key: dict(wavelength_values) if isinstance(wavelength_values, defaultdict) else wavelength_values
                for type_key, wavelength_values in types.items()} for cycle, types in cycles.items()} for
        reaction, cycles in concentrations.items()}

    return concentrations, deployment_info