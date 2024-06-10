from collections import defaultdict

import numpy as np
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Max, Subquery, Avg
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods

from pFIONA_api.analysis.formula import absorbance
from pFIONA_sensors import models
from pFIONA_sensors.models import Sensor, Spectrum, SpectrumType, Time, Value
from django.db.models import Min, Max


# def get_last_spectrum(current_reaction, cycle, timestamp, sensor_id, spectrum_type=None):
#     # Construct the target spectrum type
#     if spectrum_type is None:
#         target_spectrum_type = f"{current_reaction}_{cycle}"
#     else:
#         target_spectrum_type = f"{current_reaction}_{cycle}_{spectrum_type}"
#
#     # Find the corresponding spectrum type
#     spectrum_type_obj = models.SpectrumType.objects.filter(type=target_spectrum_type).first()
#     if not spectrum_type_obj:
#         raise ValueError(f"No spectrum type found for {target_spectrum_type}")
#
#     # Find the last spectrum for this type before the given timestamp and associated with the sensor_id
#     last_spectrum = models.Spectrum.objects.filter(
#         pfiona_spectrumtype=spectrum_type_obj,
#         pfiona_sensor__id=sensor_id,
#         pfiona_time__timestamp__lte=timestamp
#     ).order_by('-pfiona_time__timestamp').first()
#
#     if not last_spectrum:
#         raise ValueError(f"No spectrum found for {target_spectrum_type} before timestamp {timestamp}")
#
#     # Retrieve the values associated with this spectrum
#     values = models.Value.objects.filter(pfiona_spectrum=last_spectrum).order_by('wavelength')
#
#     return values
#
#
# def convert_queryset_to_list(queryset):
#     # Convert the QuerySet to a list of values
#     return [value.value for value in queryset]
#
#
# def get_last_3_spectrums(current_reaction, cycle, timestamp, sensor_id):
#     # Find the last spectra for Dark, Reference, and Sample types
#     spectrums = {
#         'Dark': convert_queryset_to_list(get_last_spectrum(current_reaction, cycle, timestamp, sensor_id, 'Dark')),
#         'Reference': convert_queryset_to_list(
#             get_last_spectrum(current_reaction, cycle, timestamp, sensor_id, 'Reference')),
#         'Sample': convert_queryset_to_list(get_last_spectrum(current_reaction, cycle, timestamp, sensor_id))
#     }
#
#     return spectrums
#
#
# def get_last_3_absorbance_spectrum(current_reaction, timestamp, sensor_id):
#     """
#     Get the absorbance spectra for Blank, Sample, Standard.
#
#     :param current_reaction: the current reaction type
#     :param cycle: the cycle type
#     :param timestamp: the timestamp to find the spectra before
#     :param sensor_id: the ID of the sensor
#
#     :return: dictionary of absorbance spectra for Dark, Reference, and Sample types
#     """
#     spectrum_blank = get_last_3_spectrums(current_reaction, 'Blank', timestamp, sensor_id)
#     spectrum_sample = get_last_3_spectrums(current_reaction, 'Sample', timestamp, sensor_id)
#     spectrum_standard = get_last_3_spectrums(current_reaction, 'Standard', timestamp, sensor_id)
#
#     absorbance_spectrum = {
#         'Blank': absorbance(spectrum_blank['Reference'], spectrum_blank['Dark'], spectrum_blank['Sample']),
#         'Sample': absorbance(spectrum_sample['Reference'], spectrum_sample['Dark'], spectrum_sample['Sample']),
#         'Standard': absorbance(spectrum_standard['Reference'], spectrum_standard['Dark'], spectrum_standard['Sample'])
#     }
#
#     return absorbance_spectrum


# #### NEW
#
# def get_last_full_mean_spectrums(current_reaction, timestamp, sensor_id, spectrum_type_prefix):
#     # Fonction pour récupérer et moyenner les valeurs des spectres par type
#     def get_mean_spectrum_values(cycle_number, spectrum_type, sensor_id, timestamp):
#         values = Value.objects.filter(
#             pfiona_spectrum__pfiona_sensor_id=sensor_id,
#             pfiona_spectrum__cycle=cycle_number,
#             pfiona_spectrum__pfiona_spectrumtype__type=spectrum_type,
#             pfiona_spectrum__pfiona_time__timestamp__lte=timestamp
#         ).order_by('wavelength')
#
#         if not values.exists():
#             return []
#
#         wavelengths = {}
#         for value in values:
#             if value.wavelength not in wavelengths:
#                 wavelengths[value.wavelength] = []
#             wavelengths[value.wavelength].append(value.value)
#
#         mean_values = {wavelength: np.mean(vals) for wavelength, vals in wavelengths.items()}
#
#         sorted_wavelengths = sorted(mean_values.keys())
#         sorted_mean_values = [mean_values[w] for w in sorted_wavelengths]
#
#         return sorted_mean_values
#
#     # Boucle pour trouver le dernier cycle où les trois types de spectres sont complets
#     while True:
#         last_cycle_query = Spectrum.objects.filter(
#             pfiona_sensor_id=sensor_id,
#             pfiona_spectrumtype__type__startswith=f"{current_reaction}_{spectrum_type_prefix}",
#             pfiona_time__timestamp__lte=timestamp
#         ).order_by('-pfiona_time__timestamp').values('cycle', 'pfiona_time__timestamp')[:1]
#
#         last_cycle = last_cycle_query.first()
#         if not last_cycle:
#             return None
#
#         last_cycle_number = last_cycle['cycle']
#         last_timestamp = last_cycle['pfiona_time__timestamp']
#
#         dark_avg = get_mean_spectrum_values(last_cycle_number, f"{current_reaction}_{spectrum_type_prefix}_Dark",
#                                             sensor_id, last_timestamp)
#         reference_avg = get_mean_spectrum_values(last_cycle_number,
#                                                  f"{current_reaction}_{spectrum_type_prefix}_Reference", sensor_id,
#                                                  last_timestamp)
#         sample_avg = get_mean_spectrum_values(last_cycle_number, f"{current_reaction}_{spectrum_type_prefix}",
#                                               sensor_id, last_timestamp)
#
#         if dark_avg and reference_avg and sample_avg:
#             return {
#                 "cycle": last_cycle_number,
#                 "timestamp": last_timestamp,
#                 f"{current_reaction}_{spectrum_type_prefix}_Dark": dark_avg,
#                 f"{current_reaction}_{spectrum_type_prefix}_Reference": reference_avg,
#                 f"{current_reaction}_{spectrum_type_prefix}": sample_avg
#             }
#
#         timestamp = last_timestamp - 1
#
#
# def get_last_full_absorbance_spectrum(current_reaction, timestamp, sensor_id, spectrum_type_prefix):
#     last_mean_spectrums = get_last_full_mean_spectrums(current_reaction, timestamp, sensor_id, spectrum_type_prefix)
#     if not last_mean_spectrums:
#         return None
#
#     dark_avg = last_mean_spectrums.get(f"{current_reaction}_{spectrum_type_prefix}_Dark")
#     reference_avg = last_mean_spectrums.get(f"{current_reaction}_{spectrum_type_prefix}_Reference")
#     sample_avg = last_mean_spectrums.get(f"{current_reaction}_{spectrum_type_prefix}")
#
#     # Vérifier que toutes les valeurs nécessaires sont présentes avant de calculer l'absorbance
#     if dark_avg is None or reference_avg is None or sample_avg is None or len(dark_avg) == 0 or len(
#             reference_avg) == 0 or len(sample_avg) == 0:
#         return None
#
#     absorbance_values = absorbance(reference_avg, dark_avg, sample_avg)
#
#     return {
#         "cycle": last_mean_spectrums["cycle"],
#         "timestamp": last_mean_spectrums["timestamp"],
#         "absorbance": absorbance_values
#     }
#
#
# def get_last_3_full_absorbance_spectrum(current_reaction, timestamp, sensor_id):
#     # Obtenir les absorbances pour Blank, Sample et Standard
#     blank_absorbance = get_last_full_absorbance_spectrum(current_reaction, timestamp, sensor_id, "Blank")
#     sample_absorbance = get_last_full_absorbance_spectrum(current_reaction, timestamp, sensor_id, "Sample")
#     standard_absorbance = get_last_full_absorbance_spectrum(current_reaction, timestamp, sensor_id, "Standard")
#
#     # Initialiser les tableaux de cycles et de timestamps
#     cycles = []
#     timestamps = []
#     absorbance_dict = {}
#
#     # Ajouter les données disponibles
#     if blank_absorbance:
#         cycles.append(blank_absorbance["cycle"])
#         timestamps.append(blank_absorbance["timestamp"])
#         absorbance_dict["Blank"] = blank_absorbance["absorbance"]
#
#     if sample_absorbance:
#         cycles.append(sample_absorbance["cycle"])
#         timestamps.append(sample_absorbance["timestamp"])
#         absorbance_dict["Sample"] = sample_absorbance["absorbance"]
#
#     if standard_absorbance:
#         cycles.append(standard_absorbance["cycle"])
#         timestamps.append(standard_absorbance["timestamp"])
#         absorbance_dict["Standard"] = standard_absorbance["absorbance"]
#
#     # Retourner le résultat
#     return {
#         "cycles": cycles,
#         "timestamps": timestamps,
#         "absorbances": absorbance_dict
#     }


# def find_all_spectrums_in_deployment(timestamp, sensor_id):
#     # Récupérer le dernier spectre avant le timestamp donné pour le capteur spécifié
#     last_spectrum = Spectrum.objects.filter(pfiona_sensor_id=sensor_id, pfiona_time__timestamp__lt=timestamp).order_by(
#         '-pfiona_time__timestamp').first()
#
#     if not last_spectrum:
#         return JsonResponse({"spectra_ids": []})
#
#     last_spectrum_id = last_spectrum.id
#     last_spectrum_type = last_spectrum.pfiona_spectrumtype.type
#
#     # Initialiser les spectres avec le dernier spectre trouvé
#     spectra_ids = [last_spectrum_id]
#
#     # Parcourir en arrière par ID décroissant pour trouver le début du déploiement
#     previous_spectra = Spectrum.objects.filter(pfiona_sensor_id=sensor_id, id__lt=last_spectrum_id).order_by('-id')
#     for spectrum in previous_spectra:
#         spectra_ids.append(spectrum.id)
#         if spectrum.cycle == 1:
#             # Vérifier le spectre précédent pour voir s'il a un cycle plus grand ou si c'est un `Standard`
#             previous_spectrum = Spectrum.objects.filter(pfiona_sensor_id=sensor_id, id__lt=spectrum.id).order_by(
#                 '-id').first()
#             if previous_spectrum and (previous_spectrum.cycle > 1 or (
#                     'Standard' in previous_spectrum.pfiona_spectrumtype.type and 'Blank_Dark' in spectrum.pfiona_spectrumtype.type)):
#                 break
#
#     # Parcourir en avant par ID croissant pour trouver la fin du déploiement
#     next_spectra = Spectrum.objects.filter(pfiona_sensor_id=sensor_id, id__gt=last_spectrum_id).order_by('id')
#     in_cycle_1 = last_spectrum.cycle == 1
#     for spectrum in next_spectra:
#         if in_cycle_1:
#             if spectrum.cycle == 1 and 'Standard' in spectrum.pfiona_spectrumtype.type:
#                 next_spectrum = Spectrum.objects.filter(pfiona_sensor_id=sensor_id, id__gt=spectrum.id).order_by(
#                     'id').first()
#                 if next_spectrum and next_spectrum.cycle == 1 and 'Blank_Dark' in next_spectrum.pfiona_spectrumtype.type:
#                     spectra_ids.append(spectrum.id)  # Inclure Silice_Standard
#                     break
#             elif spectrum.cycle > 1:
#                 in_cycle_1 = False
#         elif spectrum.cycle == 1:
#             break
#         spectra_ids.append(spectrum.id)
#
#     # Trier les IDs pour conserver l'ordre original
#     spectra_ids = sorted(set(spectra_ids))
#
#     return spectra_ids


def get_all_spectrums_in_deployment(timestamp, sensor_id):
    # Récupérer le dernier spectre avant le timestamp donné pour le capteur spécifié
    last_spectrum = Spectrum.objects.filter(pfiona_sensor_id=sensor_id, pfiona_time__timestamp__lt=timestamp).order_by(
        '-pfiona_time__timestamp').first()

    if last_spectrum:
        deployment_id = last_spectrum.deployment

        # Récupérer tous les spectres associés au même déploiement
        spectrums = Spectrum.objects.filter(deployment=deployment_id).select_related('pfiona_spectrumtype')

        # Organiser les spectres en sous-tableaux en fonction du cycle, du type et du sous-cycle
        spectrums_by_cycle = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

        current_subcycle = defaultdict(lambda: defaultdict(int))

        for spectrum in spectrums:
            # Récupérer les valeurs associées à ce spectre
            values = Value.objects.filter(pfiona_spectrum=spectrum).values('wavelength', 'value').order_by('wavelength')

            spectrum_data = {
                'id': spectrum.id,
                'time': spectrum.pfiona_time.timestamp,
                'spectrumtype': spectrum.pfiona_spectrumtype.type,
                'cycle': spectrum.cycle,
                'deployment': spectrum.deployment,
                'values': list(values),
            }
            cycle = spectrum.cycle
            spectrum_type = spectrum.pfiona_spectrumtype.type

            # Déterminer le type principal
            if "Blank" in spectrum_type:
                key = 'Blank'
                if "Blank_Dark" in spectrum_type and spectrums_by_cycle[cycle][key][current_subcycle[cycle][key]]:
                    current_subcycle[cycle][key] += 1
                spectrums_by_cycle[cycle][key][current_subcycle[cycle][key]].append(spectrum_data)
            elif "Sample" in spectrum_type:
                key = 'Sample'
                if "Sample_Dark" in spectrum_type and spectrums_by_cycle[cycle][key][current_subcycle[cycle][key]]:
                    current_subcycle[cycle][key] += 1
                spectrums_by_cycle[cycle][key][current_subcycle[cycle][key]].append(spectrum_data)
            elif "Standard" in spectrum_type:
                key = 'Standard'
                if "Standard_Dark" in spectrum_type and spectrums_by_cycle[cycle][key][current_subcycle[cycle][key]]:
                    current_subcycle[cycle][key] += 1
                spectrums_by_cycle[cycle][key][current_subcycle[cycle][key]].append(spectrum_data)

        return spectrums_by_cycle
    else:
        return None


def get_all_absorbance_spectrums_in_deployment(timestamp, sensor_id):
    spectrums = get_all_spectrums_in_deployment(timestamp, sensor_id)
    if not spectrums:
        return None

    absorbance_data = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))

    for cycle, types in spectrums.items():
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
                        absorbance_data[cycle][type_key][subcycle] = absorbance_values
                    else:
                        print(
                            f"Skipping due to shape mismatch: ref={len(ref_values)}, dark={len(dark_values)}, sample={len(sample_values)}")

    # Convert defaultdict to dict to ensure JSON serialization
    absorbance_data = {k: dict(v) for k, v in absorbance_data.items()}
    for cycle, types in absorbance_data.items():
        for type_key, subcycles in types.items():
            absorbance_data[cycle][type_key] = dict(subcycles)

    return absorbance_data


def get_cycle_count(timestamp, sensor_id):
    # Récupérer le dernier spectre avant le timestamp donné pour le capteur spécifié
    last_spectrum = Spectrum.objects.filter(pfiona_sensor_id=sensor_id, pfiona_time__timestamp__lt=timestamp).order_by(
        '-pfiona_time__timestamp').first()

    if last_spectrum:
        deployment_id = last_spectrum.deployment

        # Compter le nombre de cycles associés au même déploiement
        cycles = Spectrum.objects.filter(deployment=deployment_id).values_list('cycle', flat=True).distinct()

        return cycles.count()
    else:
        return 0


from collections import defaultdict
from django.db.models import Min, Max

from collections import defaultdict
from django.db.models import Min, Max

from collections import defaultdict
from django.db.models import Min, Max

def get_spectrums_in_cycle(timestamp, sensor_id, cycle):
    # Récupérer le dernier spectre avant le timestamp donné pour le capteur spécifié
    last_spectrum = Spectrum.objects.filter(pfiona_sensor_id=sensor_id, pfiona_time__timestamp__lt=timestamp).order_by(
        '-pfiona_time__timestamp').first()

    if last_spectrum:
        deployment_id = last_spectrum.deployment

        # Récupérer les timestamps de début et de fin du déploiement
        deployment_times = Spectrum.objects.filter(deployment=deployment_id).aggregate(
            deployment_start_time=Min('pfiona_time__timestamp'),
            deployment_end_time=Max('pfiona_time__timestamp')
        )

        # Récupérer les timestamps de début et de fin du cycle
        cycle_times = Spectrum.objects.filter(deployment=deployment_id, cycle=cycle).aggregate(
            cycle_start_time=Min('pfiona_time__timestamp'),
            cycle_end_time=Max('pfiona_time__timestamp')
        )

        # Récupérer tous les spectres associés au même déploiement et cycle
        spectrums = Spectrum.objects.filter(deployment=deployment_id, cycle=cycle).select_related('pfiona_spectrumtype')

        spectrums_data = defaultdict(lambda: defaultdict(lambda: defaultdict(list)))
        wavelengths = []

        current_subcycle = defaultdict(lambda: defaultdict(int))

        for spectrum in spectrums:
            # Récupérer les valeurs associées à ce spectre
            values = Value.objects.filter(pfiona_spectrum=spectrum).values('wavelength', 'value').order_by('wavelength')
            if not wavelengths:
                wavelengths = [v['wavelength'] for v in values]  # Collect wavelengths once

            spectrum_data = {
                'id': spectrum.id,
                'time': spectrum.pfiona_time.timestamp,
                'spectrumtype': spectrum.pfiona_spectrumtype.type,
                'cycle': spectrum.cycle,
                'deployment': spectrum.deployment,
                'values': list(values),
            }
            spectrum_type = spectrum.pfiona_spectrumtype.type
            reaction_type = spectrum_type.split('_')[0]

            # Déterminer le type principal
            if "Blank" in spectrum_type:
                key = 'Blank'
                if "Blank_Dark" in spectrum_type and spectrums_data[reaction_type][key][current_subcycle[reaction_type][key]]:
                    current_subcycle[reaction_type][key] += 1
                spectrums_data[reaction_type][key][current_subcycle[reaction_type][key]].append(spectrum_data)
            elif "Sample" in spectrum_type:
                key = 'Sample'
                if "Sample_Dark" in spectrum_type and spectrums_data[reaction_type][key][current_subcycle[reaction_type][key]]:
                    current_subcycle[reaction_type][key] += 1
                spectrums_data[reaction_type][key][current_subcycle[reaction_type][key]].append(spectrum_data)
            elif "Standard" in spectrum_type:
                key = 'Standard'
                if "Standard_Dark" in spectrum_type and spectrums_data[reaction_type][key][current_subcycle[reaction_type][key]]:
                    current_subcycle[reaction_type][key] += 1
                spectrums_data[reaction_type][key][current_subcycle[reaction_type][key]].append(spectrum_data)

        deployment_info = {
            'deployment_id': deployment_id,
            'deployment_start_time': deployment_times['deployment_start_time'],
            'deployment_end_time': deployment_times['deployment_end_time'],
            'cycle_start_time': cycle_times['cycle_start_time'],
            'cycle_end_time': cycle_times['cycle_end_time'],
        }

        return spectrums_data, wavelengths, deployment_info
    else:
        return None, None, None





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



