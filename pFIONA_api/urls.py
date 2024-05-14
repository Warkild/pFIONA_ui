from django.urls import path
from . import views

urlpatterns = [
    path('set_current_reaction/<int:sensor_id>', views.api_set_current_reaction, name='set_current_reaction'),
    path('get_current_reaction/<int:sensor_id>', views.api_get_current_reaction, name='get_current_reaction'),
]