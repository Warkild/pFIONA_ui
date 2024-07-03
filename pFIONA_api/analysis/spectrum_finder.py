import numpy as np

from pFIONA_api.analysis.formula import absorbance, concentration
from pFIONA_api.queries import get_standard_concentration
from pFIONA_sensors.models import Spectrum, Reaction, WavelengthMonitored

from collections import defaultdict
from django.db.models import Q, Min, Max
from django.contrib.postgres.aggregates import ArrayAgg

"""
CYCLE COUNT
"""


def get_cycle_count(timestamp, sensor_id):
    """
    Retrieve the number of cycles for a given sensor before a specified timestamp deployment.

    :param timestamp: The timestamp to compare against.
    :param sensor_id: The ID of the sensor to retrieve data for.
    :return: The count of cycles associated with the same deployment.
    """
    # Retrieve the latest spectrum before the given timestamp for the specified sensor
    last_spectrum = Spectrum.objects.filter(
        pfiona_sensor_id=sensor_id,
        pfiona_time__timestamp__lt=timestamp
    ).exclude(
        pfiona_spectrumtype__type__endswith='wavelength_monitored',
        cycle=0
    ).order_by('-pfiona_time__timestamp').first()

    if last_spectrum:
        deployment_id = last_spectrum.deployment

        # Count the number of cycles associated with the same deployment
        cycles = Spectrum.objects.filter(
            deployment=deployment_id,
            cycle__gte=1
        ).values_list('cycle', flat=True).distinct()

        return cycles.count()
    else:
        return 0


"""
GET RAW SPECTRUMS
"""


def get_spectrums_in_cycle_full_info(timestamp, sensor_id, cycle, wavelength_monitored=False):
    """
    Retrieve full information about spectrums in a specific cycle for a given sensor.

    :param timestamp: The timestamp to compare against.
    :param sensor_id: The ID of the sensor to retrieve data for.
    :param cycle: The cycle number to retrieve spectrums for.
    :param wavelength_monitored: Boolean to include 'wavelength_monitored' spectrums or not.
    :return: A tuple containing spectrums data, wavelengths, and deployment information.
    """

    # Retrieve the latest spectrum before the given timestamp for the specified sensor
    last_spectrum = Spectrum.objects.filter(
        pfiona_sensor_id=sensor_id,
        pfiona_time__timestamp__lt=timestamp,
        cycle__gte=1
    ).exclude(
        pfiona_spectrumtype__type__endswith='wavelength_monitored'
    ).order_by('-pfiona_time__timestamp').first()

    # If no spectrum is found, return None for all outputs
    if not last_spectrum:
        return None, None, None

    # Get the deployment ID from the last spectrum found
    deployment_id = last_spectrum.deployment

    # Aggregate start and end times for both the deployment and the specific cycle
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

    # Extract the aggregated times
    deployment_start_time = times['deployment_start_time']
    deployment_end_time = times['deployment_end_time']
    cycle_start_time = times['cycle_start_time']
    cycle_end_time = times['cycle_end_time']

    # Retrieve spectrums for the given cycle and sensor, with or without wavelength monitoring
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

    # Initialize a dictionary to organize spectrum data
    spectrums_data = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    wavelengths = []
    current_subcycle = defaultdict(lambda: defaultdict(int))

    # Iterate over each spectrum to sort and organize data
    for spectrum in spectrums:
        if not wavelengths:
            wavelengths = sorted(spectrum.wavelengths)  # Sort wavelengths initially

        # Sort values by the sorted order of wavelengths
        sorted_values = [value for _, value in sorted(zip(spectrum.wavelengths, spectrum.values))]

        # Prepare spectrum data structure
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

        # Determine the key for organizing spectrums based on their type
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

        # Handle subcycle increment for specific conditions
        if key in spectrum_type and 'Dark' in spectrum_type and spectrums_data[reaction_type][key][
            current_subcycle[reaction_type][key]]:
            current_subcycle[reaction_type][key] += 1

        # Append spectrum data to the organized dictionary
        spectrums_data[reaction_type][key][current_subcycle[reaction_type][key]].append(spectrum_data)

    # Prepare deployment information
    deployment_info = {
        'deployment_id': deployment_id,
        'deployment_start_time': deployment_start_time,
        'deployment_end_time': deployment_end_time,
        'cycle_start_time': cycle_start_time,
        'cycle_end_time': cycle_end_time,
    }

    # Return the organized spectrums data, sorted wavelengths, and deployment information
    return spectrums_data, wavelengths, deployment_info


def get_spectrums_in_deployment_full_info(timestamp, sensor_id, wavelength_monitored=False):
    """
    Retrieve full spectrum information for an entire deployment.

    This function gathers spectrum data for all cycles within a deployment,
    including wavelengths and deployment information.

    :param timestamp: The timestamp to compare against.
    :param sensor_id: The ID of the sensor to retrieve data for.
    :param wavelength_monitored: Boolean flag to include 'wavelength_monitored' spectrums or not.
    :return: A tuple containing all spectrums data, all wavelengths, and deployment information.
    """
    # Retrieve the total number of cycles for the deployment
    cycle_count = get_cycle_count(timestamp, sensor_id)

    if cycle_count == 0:
        return None, None, None

    all_spectrums_data = defaultdict(lambda: defaultdict(dict))
    all_wavelengths = []
    deployment_info = None

    # Iterate over each cycle to retrieve full spectrum information
    for cycle in range(1, cycle_count + 1):
        spectrums_data, wavelengths, cycle_deployment_info = get_spectrums_in_cycle_full_info(
            timestamp, sensor_id, cycle, wavelength_monitored=wavelength_monitored
        )

        if spectrums_data:
            all_spectrums_data[cycle] = spectrums_data

        if wavelengths:
            if not all_wavelengths:
                all_wavelengths = wavelengths

        if not deployment_info and cycle_deployment_info:
            deployment_info = cycle_deployment_info

    return all_spectrums_data, all_wavelengths, deployment_info


"""
ABSORBANCE SPECTRUMS
"""


def get_absorbance_spectrums_in_cycle(timestamp, sensor_id, cycle):
    """
    Retrieve absorbance spectrums for a specific cycle and sensor.

    :param timestamp: The timestamp to compare against.
    :param sensor_id: The ID of the sensor to retrieve data for.
    :param cycle: The cycle number to retrieve spectrums for.
    :return: A tuple containing absorbance data, wavelengths, and deployment information.
    """
    # Retrieve full spectrum information for the specified cycle and sensor
    spectrums, wavelengths, deployment_info = get_spectrums_in_cycle_full_info(timestamp, sensor_id, cycle)
    if not spectrums:
        return None, None, None

    absorbance_data = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

    # Process each reaction type and its corresponding spectrum data
    for reaction, types in spectrums.items():
        for type_key, subcycles in types.items():
            for subcycle, spectrums_list in subcycles.items():
                # Separate reference, dark, and sample scans
                ref_scan = [s['values'] for s in spectrums_list if 'Reference' in s['spectrumtype']]
                dark_scan = [s['values'] for s in spectrums_list if 'Dark' in s['spectrumtype']]
                sample_scan = [s['values'] for s in spectrums_list if
                               type_key in s['spectrumtype'] and 'Dark' not in s['spectrumtype'] and 'Reference' not in
                               s['spectrumtype'] and 'wavelength_monitored' not in s['spectrumtype']]

                # Ensure all necessary scans are available
                if ref_scan and dark_scan and sample_scan:
                    ref_values = [v[1] for v in ref_scan[0]]
                    dark_values = [v[1] for v in dark_scan[0]]
                    sample_values = [v[1] for v in sample_scan[0]]

                    # Compute absorbance values if the lengths match
                    if len(ref_values) == len(dark_values) == len(sample_values):
                        absorbance_values = absorbance(ref_values, dark_values, sample_values)
                        absorbance_data[reaction][type_key][subcycle] = absorbance_values
                        deployment_info["time_" + str(reaction) + "_" + str(type_key) + "_subcycle_" + str(subcycle)] = \
                            [s['time'] for s in spectrums_list if
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
    """
    Retrieve the mean absorbance spectrums for a specific cycle and sensor.

    This function calculates the average absorbance values across multiple subcycles
    (e.g., multiple scans of Blank, Sample, Standard).

    :param timestamp: The timestamp to compare against.
    :param sensor_id: The ID of the sensor to retrieve data for.
    :param cycle: The cycle number to retrieve spectrums for.
    :return: A tuple containing mean absorbance data, wavelengths, and deployment information.
    """
    # Retrieve absorbance data, wavelengths, and deployment info for the specified cycle and sensor
    absorbance_data, wavelengths, deployment_info = get_absorbance_spectrums_in_cycle(timestamp, sensor_id, cycle)

    if not absorbance_data:
        return None, None, None

    mean_absorbance_data = defaultdict(lambda: defaultdict(list))

    # Process each reaction and its corresponding absorbance data
    for reaction, types in absorbance_data.items():
        for type_key, subcycles in types.items():
            all_subcycle_values = []

            # Collect all subcycle values for the current type key
            for subcycle, values in subcycles.items():
                all_subcycle_values.append(values)

            # Calculate the mean values if there are multiple subcycles
            if all_subcycle_values:
                mean_values = np.mean(all_subcycle_values, axis=0).tolist()
                mean_absorbance_data[reaction][type_key] = mean_values

    # Convert defaultdict to dict to ensure JSON serialization
    mean_absorbance_data = {k: dict(v) for k, v in mean_absorbance_data.items()}
    for reaction, types in mean_absorbance_data.items():
        mean_absorbance_data[reaction] = {k: v for k, v in types.items()}

    return mean_absorbance_data, wavelengths, deployment_info


def get_absorbance_spectrums_in_cycle_full_info(timestamp, sensor_id, cycle):
    """
    Retrieve absorbance spectrum information for a specific cycle and sensor.

    This function calculates absorbance values for spectrums within a specified cycle,
    based on reference, dark, and sample scans.

    :param timestamp: The timestamp to compare against.
    :param sensor_id: The ID of the sensor to retrieve data for.
    :param cycle: The cycle number to retrieve absorbance spectrums for.
    :return: A tuple containing absorbance data, wavelengths, and deployment information.
    """
    # Retrieve full spectrum information for the specified cycle and sensor
    spectrums, wavelengths, deployment_info = get_spectrums_in_cycle_full_info(timestamp, sensor_id, cycle)
    if not spectrums:
        return None, None, None

    absorbance_data = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

    # Process each reaction and its corresponding spectrum data
    for reaction, types in spectrums.items():
        for type_key, subcycles in types.items():
            for subcycle, spectrums_list in subcycles.items():
                # Separate reference, dark, and sample scans
                ref_scan = [s['values'] for s in spectrums_list if 'Reference' in s['spectrumtype']]
                dark_scan = [s['values'] for s in spectrums_list if 'Dark' in s['spectrumtype']]
                sample_scan = [s['values'] for s in spectrums_list if
                               type_key in s['spectrumtype'] and 'Dark' not in s['spectrumtype'] and 'Reference' not in
                               s['spectrumtype'] and 'wavelength_monitored' not in s['spectrumtype']]

                # Ensure all necessary scans are available
                if ref_scan and dark_scan and sample_scan:
                    ref_values = [v[1] for v in ref_scan[0]]
                    dark_values = [v[1] for v in dark_scan[0]]
                    sample_values = [v[1] for v in sample_scan[0]]

                    # Compute absorbance values if the lengths match
                    if len(ref_values) == len(dark_values) == len(sample_values):
                        absorbance_values = absorbance(ref_values, dark_values, sample_values)
                        absorbance_data[reaction][type_key][subcycle] = absorbance_values
                        deployment_info["time_" + str(reaction) + "_" + str(type_key) + "_subcycle_" + str(subcycle)] = \
                            [s['time'] for s in spectrums_list if
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


def get_absorbance_spectrums_in_deployment_full_info(timestamp, sensor_id):
    """
    Retrieve absorbance spectrum information for an entire deployment.

    This function gathers absorbance spectrum data for all cycles within a deployment,
    including wavelengths and deployment information.

    :param timestamp: The timestamp to compare against.
    :param sensor_id: The ID of the sensor to retrieve data for.
    :return: A tuple containing all absorbance data, all wavelengths, and deployment information.
    """
    # Retrieve the total number of cycles for the deployment
    cycle_count = get_cycle_count(timestamp, sensor_id)

    # If no cycles are found, return None for all outputs
    if cycle_count == 0:
        return None, None, None

    # Initialize data structures to store absorbance data, wavelengths, and deployment information
    all_absorbance_data = defaultdict(lambda: defaultdict(dict))
    all_wavelengths = []
    deployment_info = None

    # Iterate over each cycle to retrieve full absorbance spectrum information
    for cycle in range(1, cycle_count + 1):
        absorbance_data, wavelengths, cycle_deployment_info = get_absorbance_spectrums_in_cycle_full_info(
            timestamp, sensor_id, cycle
        )

        # Store absorbance data for the current cycle
        if absorbance_data:
            all_absorbance_data[cycle] = absorbance_data

        # Store wavelengths if not already stored
        if wavelengths:
            if not all_wavelengths:
                all_wavelengths = wavelengths

        # Update deployment information with the current cycle information
        if cycle_deployment_info:
            deployment_info = update_deployment_info_with_cycle(deployment_info, cycle_deployment_info, cycle)

    # Return the collected absorbance data, wavelengths, and deployment information
    return all_absorbance_data, all_wavelengths, deployment_info


"""
MONITORED WAVELENGTHS
"""


def get_monitored_wavelength_values_in_cycle(timestamp, sensor_id, cycle):
    """
    Retrieve monitored absorbance wavelength values for a specific cycle and sensor.

    This function calculates the mean absorbance values for the monitored wavelengths
    within a specified cycle.

    :param timestamp: The timestamp to compare against.
    :param sensor_id: The ID of the sensor to retrieve data for.
    :param cycle: The cycle number to retrieve wavelength values for.
    :return: A dictionary containing monitored wavelength values and deployment information.
    """
    # Retrieve mean absorbance data, wavelengths, and deployment info for the specified cycle and sensor
    mean_absorbance_data, wavelengths, deployment_info = get_mean_absorbance_spectrums_in_cycle(timestamp, sensor_id,
                                                                                                cycle)

    if not mean_absorbance_data:
        return None

    monitored_wavelength_values = defaultdict(dict)

    # Process each reaction and its corresponding mean absorbance data
    for reaction, types in mean_absorbance_data.items():
        try:
            # Retrieve the Reaction object corresponding to the reaction name
            reaction_obj = Reaction.objects.get(name=reaction, standard__pfiona_sensor_id=sensor_id)
        except Reaction.DoesNotExist:
            # If the reaction is not found, skip this reaction
            continue

        # Retrieve all monitored wavelengths for this reaction
        monitored_wavelengths = list(
            WavelengthMonitored.objects.filter(pfiona_reaction=reaction_obj).values_list('wavelength', flat=True))

        # Sort the monitored wavelengths in ascending order
        monitored_wavelengths.sort()

        # Find the indices of the closest wavelengths
        for type_key, mean_values in types.items():
            wavelength_values = {}

            for mw in monitored_wavelengths:
                closest_index = (np.abs(np.array(wavelengths) - mw)).argmin()

                # Add the mean absorbance value to the monitored wavelength
                wavelength_values[mw] = mean_values[closest_index]

            if wavelength_values:
                monitored_wavelength_values[reaction][type_key] = dict(sorted(wavelength_values.items()))

    # Convert defaultdict to dict to ensure JSON serialization
    monitored_wavelength_values = {k: dict(v) for k, v in monitored_wavelength_values.items()}
    for reaction, types in monitored_wavelength_values.items():
        monitored_wavelength_values[reaction] = {k: dict(v) for k, v in types.items()}

    return monitored_wavelength_values, deployment_info


def get_monitored_wavelength_values_in_deployment(timestamp, sensor_id):
    """
    Retrieve monitored absorbance wavelength values for an entire deployment.

    This function calculates the monitored wavelength values for all cycles within a deployment.

    :param timestamp: The timestamp to compare against.
    :param sensor_id: The ID of the sensor to retrieve data for.
    :return: A dictionary containing monitored wavelength values for each cycle and deployment information.
    """
    # Get the total number of cycles for the deployment
    total_cycles = get_cycle_count(timestamp, sensor_id)

    all_monitored_wavelength_values = defaultdict(lambda: defaultdict(lambda: defaultdict(dict)))
    deployment_info = None

    # Iterate over each cycle to retrieve monitored wavelength values
    for cycle in range(1, total_cycles + 1):
        monitored_wavelength_values, deployment_info = get_monitored_wavelength_values_in_cycle(timestamp, sensor_id,
                                                                                                cycle)

        if monitored_wavelength_values:
            # Extract cycle start and end times from deployment info
            cycle_start_time = deployment_info.get('cycle_start_time')
            cycle_end_time = deployment_info.get('cycle_end_time')

            for reaction, types in monitored_wavelength_values.items():
                if cycle not in all_monitored_wavelength_values[reaction]:
                    all_monitored_wavelength_values[reaction][cycle] = defaultdict(dict)

                # Add cycle start and end times to the monitored wavelength values
                all_monitored_wavelength_values[reaction][cycle]['cycle_start_time'] = cycle_start_time
                all_monitored_wavelength_values[reaction][cycle]['cycle_end_time'] = cycle_end_time

                for type_key, wavelength_values in types.items():
                    if type_key not in all_monitored_wavelength_values[reaction][cycle]:
                        all_monitored_wavelength_values[reaction][cycle][type_key] = {}
                    for wavelength, value in wavelength_values.items():
                        all_monitored_wavelength_values[reaction][cycle][type_key][wavelength] = value

    # Convert defaultdict to dict to ensure JSON serialization
    all_monitored_wavelength_values = {reaction: {
        cycle: {type_key: dict(wavelength_values) if isinstance(wavelength_values, defaultdict) else wavelength_values
                for type_key, wavelength_values in types.items()} for cycle, types in cycles.items()} for
        reaction, cycles in all_monitored_wavelength_values.items()}

    # Remove cycle start and end times from deployment info
    if deployment_info['cycle_start_time']:
        deployment_info.pop('cycle_start_time', None)
    if deployment_info['cycle_end_time']:
        deployment_info.pop('cycle_end_time', None)

    return all_monitored_wavelength_values, deployment_info


def get_only_wavelength_monitored_through_time_in_cycle_full_info(timestamp, sensor_id, cycle):
    """
    Retrieve only wavelength monitored spectrum information for a specific cycle and sensor.

    This function gathers spectrum data for spectrums that have types ending with 'wavelength_monitored'
    within a specified cycle, including wavelengths and deployment information.

    :param timestamp: The timestamp to compare against.
    :param sensor_id: The ID of the sensor to retrieve data for.
    :param cycle: The cycle number to retrieve spectrum information for.
    :return: A tuple containing spectrums data, wavelengths, and deployment information.
    """
    # Retrieve the latest spectrum before the given timestamp for the specified sensor
    last_spectrum = Spectrum.objects.filter(
        pfiona_sensor_id=sensor_id,
        pfiona_time__timestamp__lt=timestamp,
        cycle__gte=1
    ).exclude(
        pfiona_spectrumtype__type__endswith='wavelength_monitored'
    ).order_by('-pfiona_time__timestamp').first()

    # If no spectrum is found, return None for all outputs
    if not last_spectrum:
        return None, None, None

    # Get the deployment ID from the last spectrum found
    deployment_id = last_spectrum.deployment

    # Aggregate start and end times for both the deployment and the specific cycle
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

    # Extract the aggregated times
    deployment_start_time = times['deployment_start_time']
    deployment_end_time = times['deployment_end_time']

    # Retrieve spectrums for the given cycle and sensor where the spectrum type ends with 'wavelength_monitored'
    spectrums = Spectrum.objects.filter(
        deployment=deployment_id,
        cycle=cycle,
        pfiona_sensor_id=sensor_id,
        pfiona_spectrumtype__type__endswith='wavelength_monitored'
    ).select_related(
        'pfiona_spectrumtype', 'pfiona_time'
    ).annotate(
        wavelengths=ArrayAgg('value__wavelength', ordering='value__wavelength'),
        values=ArrayAgg('value__value', ordering='value__wavelength')
    ).order_by('id')

    # Initialize a dictionary to organize spectrum data
    spectrums_data = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    wavelengths_dict = defaultdict(list)
    current_subcycle = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
    previous_id = defaultdict(lambda: defaultdict(lambda: None))

    # Iterate over each spectrum to sort and organize data
    for spectrum in spectrums:
        spectrum_type = spectrum.pfiona_spectrumtype.type
        reaction_type = spectrum_type.split('_')[0]

        if not wavelengths_dict[reaction_type]:
            wavelengths_dict[reaction_type] = sorted(
                spectrum.wavelengths)  # Sort wavelengths initially for each reaction type

        # Sort values by the sorted order of wavelengths
        sorted_values = [value for _, value in sorted(zip(spectrum.wavelengths, spectrum.values))]

        # Prepare spectrum data structure
        spectrum_data = {
            'id': spectrum.id,
            'time': spectrum.pfiona_time.timestamp,
            'spectrumtype': spectrum.pfiona_spectrumtype.type,
            'cycle': spectrum.cycle,
            'deployment': spectrum.deployment,
            'values': list(zip(wavelengths_dict[reaction_type], sorted_values))
            # Use sorted wavelengths and corresponding values
        }

        parts = spectrum_type.split('_')

        # Determine the key for organizing spectrums based on their type
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

        # Check if this is a new subcycle for the specific reaction and key
        if previous_id[reaction_type][key] is not None and spectrum.id != previous_id[reaction_type][key] + 1:
            current_subcycle[reaction_type][key][spectrum.cycle] += 1

        previous_id[reaction_type][key] = spectrum.id

        # Append spectrum data to the organized dictionary
        spectrums_data[reaction_type][key][current_subcycle[reaction_type][key][spectrum.cycle]].append(spectrum_data)

    # Prepare deployment information
    deployment_info = {
        'deployment_id': deployment_id,
        'deployment_start_time': deployment_start_time,
        'deployment_end_time': deployment_end_time,
    }

    # Return the organized spectrums data, wavelengths dictionary, and deployment information
    return spectrums_data, wavelengths_dict, deployment_info


def get_dark_reference_in_cycle_full_info(timestamp, sensor_id, cycle):
    """
    Retrieve only dark and reference spectrum information for a specific cycle and sensor.

    This function gathers spectrum data for spectrums that have types ending with 'wavelength_monitored'
    within a specified cycle, including wavelengths and deployment information.

    :param timestamp: The timestamp to compare against.
    :param sensor_id: The ID of the sensor to retrieve data for.
    :param cycle: The cycle number to retrieve spectrum information for.
    :return: A tuple containing spectrums data, wavelengths, and deployment information.
    """
    # Retrieve the latest spectrum before the given timestamp for the specified sensor
    last_spectrum = Spectrum.objects.filter(
        pfiona_sensor_id=sensor_id,
        pfiona_time__timestamp__lt=timestamp,
        cycle__gte=1
    ).exclude(
        pfiona_spectrumtype__type__endswith='wavelength_monitored'
    ).order_by('-pfiona_time__timestamp').first()

    # If no spectrum is found, return None for all outputs
    if not last_spectrum:
        return None, None, None

    # Get the deployment ID from the last spectrum found
    deployment_id = last_spectrum.deployment

    # Aggregate start and end times for both the deployment and the specific cycle
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

    # Extract the aggregated times
    deployment_start_time = times['deployment_start_time']
    deployment_end_time = times['deployment_end_time']

    # Retrieve spectrums for the given cycle and sensor where the spectrum type ends 'Dark', or 'Reference'
    spectrums = Spectrum.objects.filter(
        deployment=deployment_id,
        cycle=cycle,
        pfiona_sensor_id=sensor_id
    ).filter(
        Q(pfiona_spectrumtype__type__endswith='Dark') |
        Q(pfiona_spectrumtype__type__endswith='Reference')
    ).select_related(
        'pfiona_spectrumtype', 'pfiona_time'
    ).annotate(
        wavelengths=ArrayAgg('value__wavelength', ordering='value__wavelength'),
        values=ArrayAgg('value__value', ordering='value__wavelength')
    ).order_by('id')

    # Initialize a dictionary to organize spectrum data
    spectrums_data = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
    wavelengths_dict = defaultdict(list)
    current_subcycle = defaultdict(lambda: defaultdict(lambda: defaultdict(int)))
    previous_id = defaultdict(lambda: defaultdict(lambda: None))

    # Iterate over each spectrum to sort and organize data
    for spectrum in spectrums:
        spectrum_type = spectrum.pfiona_spectrumtype.type
        reaction_type = spectrum_type.split('_')[0]

        if not wavelengths_dict[reaction_type]:
            wavelengths_dict[reaction_type] = sorted(
                spectrum.wavelengths)  # Sort wavelengths initially for each reaction type

        # Sort values by the sorted order of wavelengths
        sorted_values = [value for _, value in sorted(zip(spectrum.wavelengths, spectrum.values))]

        # Prepare spectrum data structure
        spectrum_data = {
            'id': spectrum.id,
            'time': spectrum.pfiona_time.timestamp,
            'spectrumtype': spectrum.pfiona_spectrumtype.type,
            'cycle': spectrum.cycle,
            'deployment': spectrum.deployment,
            'values': list(zip(wavelengths_dict[reaction_type], sorted_values))
            # Use sorted wavelengths and corresponding values
        }

        parts = spectrum_type.split('_')

        # Determine the key for organizing spectrums based on their type
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

        # Check if this is a new subcycle for the specific reaction and key
        if previous_id[reaction_type][key] is not None and spectrum.id != previous_id[reaction_type][key] + 1:
            current_subcycle[reaction_type][key][spectrum.cycle] += 1

        previous_id[reaction_type][key] = spectrum.id

        # Append spectrum data to the organized dictionary
        spectrums_data[reaction_type][key][current_subcycle[reaction_type][key][spectrum.cycle]].append(spectrum_data)

    # Prepare deployment information
    deployment_info = {
        'deployment_id': deployment_id,
        'deployment_start_time': deployment_start_time,
        'deployment_end_time': deployment_end_time,
    }

    # Return the organized spectrums data, wavelengths dictionary, and deployment information
    return spectrums_data, wavelengths_dict, deployment_info


def get_only_absorbance_wavelength_monitored_through_time_in_cycle_full_info(timestamp, sensor_id, cycle):
    """
    Retrieve absorbance spectrum information for wavelength-monitored spectrums within a specified cycle and sensor.

    This function calculates absorbance values for wavelength-monitored spectrums within a specified cycle,
    based on reference, dark, and sample scans.

    :param timestamp: The timestamp to compare against.
    :param sensor_id: The ID of the sensor to retrieve data for.
    :param cycle: The cycle number to retrieve absorbance spectrums for.
    :return: A tuple containing absorbance data, wavelengths, and deployment information.
    """
    # Retrieve wavelength-monitored spectrum information for the specified cycle and sensor
    wavelength_monitored_data, wavelengths, deployment_info = get_only_wavelength_monitored_through_time_in_cycle_full_info(timestamp, sensor_id, cycle)
    if not wavelength_monitored_data:
        return None, None, None

    # Retrieve dark and reference spectrum information for the specified cycle and sensor
    dark_reference_data, _, _ = get_dark_reference_in_cycle_full_info(timestamp, sensor_id, cycle)
    if not dark_reference_data:
        return None, None, None

    absorbance_data = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

    # Process each reaction and its corresponding spectrum data
    for reaction, types in wavelength_monitored_data.items():
        for type_key, subcycles in types.items():
            for subcycle, spectrums_list in subcycles.items():
                # Separate reference and dark scans
                dark_scan = []
                ref_scan = []
                for dr_spectrum in dark_reference_data.get(reaction, {}).get(type_key, {}).get(subcycle, []):
                    if 'Dark' in dr_spectrum['spectrumtype']:
                        dark_scan = dr_spectrum['values']
                    elif 'Reference' in dr_spectrum['spectrumtype']:
                        ref_scan = dr_spectrum['values']

                if not dark_scan or not ref_scan:
                    continue

                # Create a dictionary for easy lookup of dark and reference values by wavelength
                dark_dict = {wl: value for wl, value in dark_scan}
                ref_dict = {wl: value for wl, value in ref_scan}

                # Process each wavelength monitored spectrum
                for spectrum in spectrums_list:
                    spectrum_type = spectrum['spectrumtype']
                    if 'wavelength_monitored' not in spectrum_type:
                        continue

                    sample_values = spectrum['values']

                    # Filter the sample values to match the wavelengths in dark and reference
                    filtered_sample_values = [(wl, value) for wl, value in sample_values if wl in dark_dict and wl in ref_dict]
                    filtered_dark_values = [dark_dict[wl] for wl, value in sample_values if wl in dark_dict and wl in ref_dict]
                    filtered_ref_values = [ref_dict[wl] for wl, value in sample_values if wl in dark_dict and wl in ref_dict]

                    # Compute absorbance values if the lengths match
                    if len(filtered_sample_values) == len(filtered_dark_values) == len(filtered_ref_values):
                        absorbance_values = absorbance(filtered_ref_values, filtered_dark_values, [value for wl, value in filtered_sample_values])
                        values = [(wl, absorbance_value) for (wl, _), absorbance_value in zip(filtered_sample_values, absorbance_values)]
                        absorbance_data[reaction][type_key][subcycle].append({
                            'id': spectrum['id'],
                            'time': spectrum['time'],
                            'spectrumtype': spectrum['spectrumtype'],
                            'cycle': spectrum['cycle'],
                            'deployment': spectrum['deployment'],
                            'values': values
                        })
                    else:
                        print(f"Skipping due to shape mismatch in {spectrum_type}: ref={len(filtered_ref_values)}, dark={len(filtered_dark_values)}, sample={len(filtered_sample_values)}")

    # Convert defaultdict to dict to ensure JSON serialization
    absorbance_data = {k: dict(v) for k, v in absorbance_data.items()}
    for reaction, types in absorbance_data.items():
        absorbance_data[reaction] = {k: dict(v) for k, v in types.items()}

    return absorbance_data, wavelengths, deployment_info



"""
CONCENTRATION
"""


def get_concentration_in_deployment(timestamp, sensor_id):
    """
    Calculate concentrations for an entire deployment based on monitored wavelength values.

    This function retrieves the monitored wavelength values for all cycles within a deployment
    and calculates the concentration of samples using either standard dilutions or blank/sample/standard
    absorbance values.

    :param timestamp: The timestamp to compare against.
    :param sensor_id: The ID of the sensor to retrieve data for.
    :return: A dictionary containing concentrations for each cycle and deployment information.
    """
    # Retrieve the total number of cycles
    cycle_count = get_cycle_count(timestamp, sensor_id)

    if cycle_count == 0:
        return None, None

    monitored_wavelength_values, deployment_info = get_monitored_wavelength_values_in_deployment(timestamp, sensor_id)
    concentrations = defaultdict(lambda: defaultdict(lambda: defaultdict(dict)))

    # Process each reaction and its corresponding cycles
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
                # Handle the regular case with blank/sample/standard
                for wavelength in wavelengths[:-1]:
                    if wavelength in abs_blank and reference_wavelength in abs_blank and wavelength in abs_standard and reference_wavelength in abs_standard:
                        abs_sample_val = abs_sample[wavelength] - abs_sample[reference_wavelength]
                        abs_blank_val = abs_blank[wavelength] - abs_blank[reference_wavelength]
                        abs_standard_val = abs_standard[wavelength] - abs_standard[reference_wavelength]

                        conc = concentration(abs_sample_val, abs_blank_val, abs_standard_val, std_conc)
                        concentrations[reaction][cycle]['concentration'][wavelength] = conc
                    else:
                        # Find the last cycle with standard dilutions
                        last_standard_dilution_data = get_last_standard_dillution(reaction, cycle, wavelength,
                                                                                  monitored_wavelength_values,
                                                                                  sensor_id)
                        if last_standard_dilution_data:
                            dilution_levels, absorbance_values = last_standard_dilution_data
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


"""
MULTI STANDARD
"""


def get_last_standard_dillution(reaction, cycle, wavelength, monitored_wavelength_values, sensor_id):
    """
    Retrieve the last standard dilution for a given cycle in multi-standard mode.

    This function searches for the last standard dilution values for a specified cycle and wavelength,
    based on previously monitored wavelength values.

    :param reaction: The name of the reaction.
    :param cycle: The cycle number to start searching from.
    :param wavelength: The wavelength to find standard dilutions for.
    :param monitored_wavelength_values: Dictionary containing monitored wavelength values for all cycles.
    :param sensor_id: The ID of the sensor to retrieve data for.
    :return: A tuple containing dilution levels and absorbance values, or None if not found.
    """
    # Get a sorted list of cycles
    cycles = sorted(monitored_wavelength_values[reaction].keys())
    cycle_index = cycles.index(cycle)

    # Iterate through previous cycles to find standard dilutions
    for i in range(cycle_index - 1, -1, -1):
        previous_cycle = cycles[i]
        if any(key.startswith('Standard_Dillution') for key in
               monitored_wavelength_values[reaction][previous_cycle].keys()):
            standard_dilution_data = {key: monitored_wavelength_values[reaction][previous_cycle][key] for key in
                                      monitored_wavelength_values[reaction][previous_cycle].keys() if
                                      key.startswith('Standard_Dillution')}

            # Check if the wavelength is present in the standard dilution data
            if wavelength in list(standard_dilution_data.values())[0].keys():
                dilution_levels = []
                absorbance_values = []

                # Collect dilution levels and corresponding absorbance values
                for dilution, absorbances in standard_dilution_data.items():
                    if wavelength in absorbances:
                        dilution_level = int(dilution.split('_')[-1]) * 0.25 * get_standard_concentration(
                            reaction_name=reaction, sensor_id=sensor_id)
                        dilution_levels.append(dilution_level)
                        absorbance_values.append(absorbances[wavelength])

                return dilution_levels, absorbance_values

    return None


"""
DEPLOYMENT LIST
"""


def get_deployment_list(sensor_id):
    """
    Retrieve a list of deployments for a specific sensor.

    This function gathers all deployments for the given sensor, along with the start and end times for each deployment.

    :param sensor_id: The ID of the sensor to retrieve deployment data for.
    :return: A list of dictionaries, each containing deployment ID, start time, and end time.
    """
    # Filter spectrums for the given sensor where cycle number is 1 or higher
    deployment_list = Spectrum.objects.filter(pfiona_sensor_id=sensor_id, cycle__gte=1).values('deployment').annotate(
        start_time=Min('pfiona_time__timestamp'),
        end_time=Max('pfiona_time__timestamp')
    ).order_by('deployment')

    # Convert the QuerySet to a list of dictionaries
    return list(deployment_list)


def update_deployment_info_with_cycle(existing_info, new_info, cycle):
    """
    Update the existing deployment information dictionary with new information,
    adding the cycle number to the time-related keys.

    :param existing_info: The existing deployment information dictionary to be updated.
    :param new_info: The new information to be added to the deployment information dictionary.
    :param cycle: The cycle number to be added to the time-related keys.
    :return: The updated deployment information dictionary.
    """
    # If existing_info is None, initialize it as an empty dictionary
    if existing_info is None:
        existing_info = {}

    # Iterate over each key-value pair in the new information dictionary
    for key, value in new_info.items():
        # If the key contains "time_", add the cycle number to the key
        if "time_" in key:
            parts = key.split('_subcycle_')
            new_key = f"{parts[0]}_cycle_{cycle}_subcycle_{parts[1]}"
        else:
            new_key = key

        # Update the existing information dictionary with the new key-value pair
        if new_key not in existing_info:
            existing_info[new_key] = value
        # If the value is a dictionary, recursively update the nested dictionary
        elif isinstance(value, dict):
            existing_info[new_key] = update_deployment_info_with_cycle(existing_info.get(new_key, {}), value, cycle)

    return existing_info
