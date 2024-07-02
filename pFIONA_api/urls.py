from django.urls import path
from . import views

urlpatterns = [
    ############
    # ANALYSIS #
    ############
    path('get_cycle_count',
         views.api_get_cycle_count,
         name='api_get_cycle_count'),
    path('get_spectrums_in_cycle_full_info',
         views.api_get_spectrum_in_cycle_full_info,
         name='api_get_spectrum_in_cycle_full_info'),
    path('get_spectrums_in_deployment_full_info',
         views.api_get_spectrum_in_deployment_full_info,
         name='api_get_spectrum_in_deployment_full_info'),
    path('get_absorbance_spectrums_in_cycle',
         views.api_get_absorbance_spectrums_in_cycle,
         name='api_get_absorbance_spectrums_in_cycle'),
    path('get_mean_absorbance_spectrums_in_cycle',
         views.api_get_mean_absorbance_spectrums_in_cycle,
         name='api_get_mean_absorbance_spectrums_in_cycle'),
    path('get_absorbance_spectrums_in_cycle_full_info',
         views.api_get_absorbance_spectrums_in_cycle_full_info,
         name='api_get_absorbance_spectrums_in_cycle_full_info'),
    path('get_absorbance_spectrums_in_deployment_full_info',
         views.api_get_absorbance_spectrums_in_deployment_full_info,
         name='api_get_absorbance_spectrums_in_deployment_full_info'),
    path('get_concentration_for_deployment',
         views.api_get_concentration_for_deployment,
         name='api_get_concentration_for_deployment'),
    path('export_raw_spectra_csv/',
         views.export_raw_spectra_csv,
         name='export_raw_spectra_csv'),
    path('export_absorbance_spectra_csv/',
         views.export_absorbance_spectra_csv,
         name='export_absorbance_spectra_csv'),
    path('export_concentration_csv/',
         views.export_concentration_csv,
         name='export_concentration_csv'),
    path('get_only_wavelength_monitored_through_time_in_cycle_full_info',
         views.api_get_only_wavelength_monitored_through_time_in_cycle_full_info,
         name='api_get_only_wavelength_monitored_through_time_in_cycle_full_info'),
    path('get_monitored_wavelength_values_in_deployment',
         views.api_get_monitored_wavelength_values_in_deployment,
         name='api_get_monitored_wavelength_values_in_deployment'),
    path('get_cycle_count',
         views.api_get_cycle_count,
         name='api_get_cycle_count'),
    path('get_deployment_list',
         views.api_get_deployment_list,
         name='api_get_deployment_list'),
    #########
    # QUERY #
    #########
    path('set_current_reaction',
         views.api_set_current_reaction,
         name='api_set_current_reaction'),
    path('get_current_reaction',
         views.api_get_current_reaction,
         name='api_get_current_reaction'),
    path('get_current_reagents_for_current_reaction',
         views.api_get_current_reagents_from_current_reaction,
         name='api_get_current_reagents_from_current_reaction'),
    path('add_reaction',
         views.api_add_reaction,
         name='api_add_reaction'),
    path('edit_reaction',
         views.api_edit_reaction,
         name='api_edit_reaction'),
    path('get_validity_reaction_to_set_as_current_reaction',
         views.api_get_validity_reaction_to_set_as_current_reaction,
         name="api_get_validity_reaction_to_set_as_current_reaction"),
    path('is_deployed',
         views.api_is_deployed,
         name='api_is_deployed'),
    path('is_stop_deploying_in_progress',
         views.api_is_stop_deploying_in_progress,
         name='api_is_stop_deploying_in_progress'),
    path('is_sleeping',
         views.api_is_sleeping,
         name='api_is_sleeping'),
    path('get_sensor_sleep',
         views.api_get_sleep,
         name='api_get_sleep'),
    path('get_sensor_sample_frequency',
         views.api_get_sample_frequency,
         name='api_get_sample_frequency'),
    path('set_sensor_general_settings',
         views.api_set_sensor_general_settings,
         name='api_set_sensor_general_settings'),
    path('get_last_states',
         views.api_get_last_states,
         name='api_get_last_states'),
    path('get_standard_concentration',
         views.api_get_standard_concentration,
         name='api_get_standard_concentration'),
    path('get_lasts_spectrum_cycle_0',
         views.api_get_lasts_spectrum_cycle_0,
         name='api_get_lasts_spectrum_cycle_0'),
    path('delete_spectrums/',
         views.api_delete_spectrums_by_deployment,
         name='api_delete_spectrums_by_deployment'),
    path('get_active_ports_names/',
         views.api_get_active_ports_names,
         name='api_get_active_ports_names'),
]
