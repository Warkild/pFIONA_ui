import csv
import pandas as pd
from django.http import HttpResponse
from datetime import datetime

from pFIONA_api.analysis.spectrum_finder import *
from pFIONA_sensors.models import Spectrum


def export_raw_data(timestamp, sensor_id):
    """
    Export raw spectrum data for a given sensor and timestamp.

    This function retrieves all spectrums before a specified timestamp and exports the data to a CSV file.

    :param timestamp: The timestamp to compare against.
    :param sensor_id: The ID of the sensor to retrieve data for.
    :return: An HTTP response containing the CSV file with the spectrum data.
    """
    # Retrieve the latest spectrum before the given timestamp for the specified sensor
    last_spectrum = Spectrum.objects.filter(
        pfiona_sensor_id=sensor_id,
        pfiona_time__timestamp__lt=timestamp,
        cycle__gte=1
    ).order_by('-pfiona_time__timestamp').first()

    # If no spectrum is found, return a 404 response
    if not last_spectrum:
        return HttpResponse("No spectra found before the given timestamp.", status=404)

    # Get the deployment ID from the last spectrum found
    deployment_id = last_spectrum.deployment

    # Retrieve all spectrums associated with the same deployment
    spectrums = Spectrum.objects.filter(
        deployment=deployment_id,
        pfiona_sensor_id=sensor_id,
        cycle__gte=1
    ).select_related(
        'pfiona_spectrumtype',
        'pfiona_time'
    ).prefetch_related('value_set').order_by('id')

    # Initialize a list to store the data
    data = []
    for spectrum in spectrums:
        # Extract spectrum details
        spectrum_type = spectrum.pfiona_spectrumtype.type
        local_datetime = datetime.fromtimestamp(spectrum.pfiona_time.timestamp).strftime('%m/%d/%Y %H:%M:%S')
        deployment = spectrum.deployment
        cycle = spectrum.cycle
        id = spectrum.id

        # Iterate over the value set associated with the spectrum
        for value in spectrum.value_set.all():
            data.append({
                'SpectrumType': spectrum_type,
                'Timestamp': local_datetime,
                'Deployment': deployment,
                'Cycle': cycle,
                'Id': id,
                'Wavelength': value.wavelength,
                'Value': value.value
            })

    # Convert the data list to a pandas DataFrame
    df = pd.DataFrame(data)

    # Pivot the DataFrame to organize data by wavelengths
    pivoted_df = df.pivot_table(
        index=['SpectrumType', 'Timestamp', 'Deployment', 'Cycle', 'Id'],
        columns='Wavelength',
        values='Value',
        aggfunc='first'
    ).fillna('').reset_index()

    # Sort the DataFrame by the 'Id' column
    pivoted_df = pivoted_df.sort_values(by='Id')

    # Create an HTTP response with CSV content
    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename="spectra.csv"'},
    )
    writer = csv.writer(response)

    # Write the header row to the CSV
    writer.writerow(pivoted_df.columns)

    # Write the data rows to the CSV
    for row in pivoted_df.itertuples(index=False):
        writer.writerow(row)

    # Return the HTTP response containing the CSV file
    return response


def export_absorbance_data(timestamp, sensor_id):
    """
    Export absorbance data for a given sensor and timestamp.

    This function retrieves all absorbance data for a specified timestamp and sensor,
    and exports the data to a CSV file.

    :param timestamp: The timestamp to compare against.
    :param sensor_id: The ID of the sensor to retrieve data for.
    :return: An HTTP response containing the CSV file with the absorbance data.
    """
    # Retrieve all absorbance data, wavelengths, and deployment information for the specified timestamp and sensor
    all_absorbance_data, all_wavelengths, deployment_info = get_absorbance_spectrums_in_deployment_full_info(timestamp,
                                                                                                             sensor_id)

    # If no absorbance data is found, return a 404 response
    if not all_absorbance_data or not isinstance(all_absorbance_data, dict):
        return HttpResponse("No absorbance data found for the given timestamp and sensor ID.", status=404)

    # Initialize a list to store the data
    data = []
    for cycle, reactions in all_absorbance_data.items():
        for reaction, types in reactions.items():
            for spectrum_type, spectrum_list in types.items():
                for wavelength_index, absorbance_values in spectrum_list.items():
                    for wavelength, absorbance_value in enumerate(absorbance_values):
                        # Create a row for each absorbance value
                        row = {
                            'Cycle': cycle,
                            'Reaction': reaction,
                            'Type': spectrum_type,
                            'Wavelength': all_wavelengths[wavelength],
                            'Absorbance': absorbance_value
                        }
                        # Add associated timestamp information
                        time_key = f'time_{reaction}_{spectrum_type}_cycle_{cycle}_subcycle_{wavelength_index}'
                        timestamp = deployment_info.get(time_key, None)
                        if timestamp is not None:
                            local_datetime = datetime.fromtimestamp(timestamp).strftime('%m/%d/%Y %H:%M:%S')
                            row['Time'] = local_datetime
                        else:
                            row['Time'] = ''
                        data.append(row)

    # Convert the data list to a pandas DataFrame
    df = pd.DataFrame(data)

    # Create a pivot table to organize the data by wavelengths
    pivoted_df = df.pivot_table(
        index=['Cycle', 'Reaction', 'Type', 'Time'],
        columns='Wavelength',
        values='Absorbance',
        aggfunc='first'
    ).fillna('').reset_index()

    # Create an HTTP response with CSV content
    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename="absorbance_data.csv"'},
    )
    writer = csv.writer(response)

    # Write the header row to the CSV
    writer.writerow(pivoted_df.columns)

    # Write the data rows to the CSV
    for row in pivoted_df.itertuples(index=False):
        writer.writerow(row)

    # Return the HTTP response containing the CSV file
    return response


def export_concentration_data(timestamp, sensor_id):
    """
    Export concentration data for a given sensor and timestamp.

    This function retrieves all concentration data for a specified timestamp and sensor,
    and exports the data to a CSV file.

    :param timestamp: The timestamp to compare against.
    :param sensor_id: The ID of the sensor to retrieve data for.
    :return: An HTTP response containing the CSV file with the concentration data.
    """
    # Retrieve all concentration data and deployment information for the specified timestamp and sensor
    all_concentration_data, deployment_info = get_concentration_in_deployment(timestamp, sensor_id)

    # If no concentration data is found, return a 404 response
    if not all_concentration_data:
        return HttpResponse("No concentration data found for the given timestamp and sensor ID.", status=404)

    # Initialize a list to store the data
    data = []

    # Iterate through the concentration data and structure it for CSV export
    for reaction, cycles in all_concentration_data.items():
        for cycle, values in cycles.items():
            if 'concentration' not in values or not values['concentration']:
                continue  # Skip cycles without concentration data
            for wavelength, concentration in values['concentration'].items():
                # Create a row for each concentration value
                row = {
                    'Cycle': cycle,
                    'Start Time': values['cycle_start_time'],
                    'End Time': values['cycle_end_time'],
                    'Reaction': reaction,
                    'Wavelength': wavelength,
                    'Concentration': concentration
                }
                data.append(row)

    # Convert the data list to a pandas DataFrame
    df = pd.DataFrame(data)

    # Create an HTTP response with CSV content
    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename="concentration_data.csv"'},
    )
    writer = csv.writer(response)

    # Write the header row to the CSV
    writer.writerow(df.columns)

    # Write the data rows to the CSV
    for row in df.itertuples(index=False):
        writer.writerow(row)

    # Return the HTTP response containing the CSV file
    return response

