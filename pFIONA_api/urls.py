from django.urls import path
from . import views

urlpatterns = [
    path('set_current_reaction/<int:sensor_id>', views.api_set_current_reaction, name='set_current_reaction'),
    path('get_current_reaction/<int:sensor_id>', views.api_get_current_reaction, name='get_current_reaction'),
    path('add_reaction', views.api_add_reaction, name='api_add_reaction'),
    path('edit_reaction', views.api_edit_reaction, name='api_edit_reaction'),
]