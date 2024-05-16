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
]