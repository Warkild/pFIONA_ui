
import csv
import pandas as pd
from django.http import HttpResponse
from datetime import datetime

from pFIONA_api.analysis.spectrum_finder import get_absorbance_spectrums_in_deployment_full_info, \
    get_concentration_in_deployment
from pFIONA_sensors.models import Spectrum


def export_raw_data(timestamp, sensor_id):
    # Récupérer le dernier spectre avant le timestamp donné
    last_spectrum = Spectrum.objects.filter(
        pfiona_sensor_id=sensor_id,
        pfiona_time__timestamp__lt=timestamp,
        cycle__gte=1
    ).order_by('-pfiona_time__timestamp').first()

    if not last_spectrum:
        return HttpResponse("No spectra found before the given timestamp.", status=404)

    deployment_id = last_spectrum.deployment

    # Récupérer tous les spectres associés au même déploiement
    spectrums = Spectrum.objects.filter(
        deployment=deployment_id,
        pfiona_sensor_id=sensor_id,
        cycle__gte=1
    ).select_related(
        'pfiona_spectrumtype',
        'pfiona_time'
    ).prefetch_related('value_set').order_by('id')

    data = []
    for spectrum in spectrums:
        spectrum_type = spectrum.pfiona_spectrumtype.type
        local_datetime = datetime.fromtimestamp(spectrum.pfiona_time.timestamp).strftime('%m/%d/%Y %H:%M:%S')
        deployment = spectrum.deployment
        cycle = spectrum.cycle
        id = spectrum.id
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

    df = pd.DataFrame(data)

    # Use pivot_table and fillna efficiently
    pivoted_df = df.pivot_table(index=['SpectrumType', 'Timestamp', 'Deployment', 'Cycle', 'Id'], columns='Wavelength',
                                values='Value', aggfunc='first').fillna('').reset_index()

    # Sort by Id
    pivoted_df = pivoted_df.sort_values(by='Id')

    # Create CSV response
    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename="spectra.csv"'},
    )
    writer = csv.writer(response)

    # Write the header
    writer.writerow(pivoted_df.columns)

    # Write the data
    for row in pivoted_df.itertuples(index=False):
        writer.writerow(row)

    return response


def export_absorbance_data(timestamp, sensor_id):
    all_absorbance_data, all_wavelengths, deployment_info = get_absorbance_spectrums_in_deployment_full_info(timestamp,
                                                                                                             sensor_id)

    if not all_absorbance_data:
        return HttpResponse("No absorbance data found for the given timestamp and sensor ID.", status=404)

    data = []
    for cycle, reactions in all_absorbance_data.items():
        for reaction, types in reactions.items():
            for spectrum_type, spectrum_list in types.items():
                for spectrum in spectrum_list:
                    for wavelength, absorbance_value in spectrum.items():
                        row = {
                            'Cycle': cycle,
                            'Reaction': reaction,
                            'Type': spectrum_type,
                            'Wavelength': wavelength,
                            'Absorbance': absorbance_value
                        }
                        data.append(row)

    df = pd.DataFrame(data)

    # Create a pivot table to organize the data
    pivoted_df = df.pivot_table(index=['Cycle', 'Reaction', 'Type'], columns='Wavelength', values='Absorbance',
                                aggfunc='first').fillna('').reset_index()

    # Create CSV response
    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename="absorbance_data.csv"'},
    )
    writer = csv.writer(response)

    # Write the header
    writer.writerow(pivoted_df.columns)

    # Write the data
    for row in pivoted_df.itertuples(index=False):
        writer.writerow(row)

    return response


def export_concentration_data(timestamp, sensor_id):
    all_concentration_data, deployment_info = get_concentration_in_deployment(timestamp, sensor_id)

    if not all_concentration_data:
        return HttpResponse("No concentration data found for the given timestamp and sensor ID.", status=404)

    data = []
    # Iterate through the concentration data and structure it for CSV export
    for reaction, cycles in all_concentration_data.items():
        for cycle, values in cycles.items():
            if 'concentration' not in values or not values['concentration']:
                continue  # Skip cycles without concentration data
            for wavelength, concentration in values['concentration'].items():
                row = {
                    'Cycle': cycle,
                    'Start Time': values['cycle_start_time'],
                    'End Time': values['cycle_end_time'],
                    'Reaction': reaction,
                    'Wavelength': wavelength,
                    'Concentration': concentration
                }
                data.append(row)

    # Convert the data to a DataFrame
    df = pd.DataFrame(data)

    # Create CSV response
    response = HttpResponse(
        content_type='text/csv',
        headers={'Content-Disposition': 'attachment; filename="concentration_data.csv"'},
    )
    writer = csv.writer(response)

    # Write the header
    writer.writerow(df.columns)

    # Write the data
    for row in df.itertuples(index=False):
        writer.writerow(row)

    return response