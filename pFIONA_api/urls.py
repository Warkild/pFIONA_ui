from django.urls import path
from . import views

urlpatterns = [
    path('set_current_reaction/<int:sensor_id>', views.api_set_current_reaction, name='api_set_current_reaction'),
    path('get_current_reaction/<int:sensor_id>', views.api_get_current_reaction, name='api_get_current_reaction'),
    path('add_reaction', views.api_add_reaction, name='api_add_reaction'),
    path('edit_reaction', views.api_edit_reaction, name='api_edit_reaction'),
    path('get_last_spectrum_all_type_view', views.api_get_last_spectrum_all_type_view,
         name='api_get_last_spectrum_all_type_view'),
    path('get_validity_reaction_to_set_as_current_reaction', views.api_get_validity_reaction_to_set_as_current_reaction,
         name="api_get_validity_reaction_to_set_as_current_reaction"),
    path('is_deployed', views.api_is_deployed, name='api_is_deployed'),
    path('is_sleeping', views.api_is_sleeping, name='api_is_sleeping'),
    path('get_sensor_sleep', views.api_get_sleep, name='api_get_sleep'),
    path('get_sensor_sample_frequency', views.api_get_sample_frequency, name='api_get_sample_frequency'),
    path('set_sensor_general_settings', views.api_set_sensor_general_settings, name='api_set_sensor_general_settings'),
    path('get_last_states', views.api_get_last_states, name='api_get_last_states'),
]
