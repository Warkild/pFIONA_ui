from django.urls import path
from . import views

urlpatterns = [
    path('list/', views.sensors_list, name='sensors_list'),
    path('add/', views.sensors_add, name='sensors_add'),
    path('<int:sensor_id>/manual/', views.sensors_manual, name='sensors_manual'),
    path('<int:sensor_id>/deploy/', views.sensors_deploy, name='sensors_deploy'),
    path('<int:sensor_id>/data/', views.sensors_data, name='sensors_data'),
    path('<int:sensor_id>/settings/', views.sensors_settings, name='sensors_settings'),
    path('<int:sensor_id>/reagents/', views.sensors_reagents, name='sensors_reagents'),
    path('<int:sensor_id>/reagents/<int:reagent_id>/delete', views.sensors_reagent_delete, name='sensors_reagent_delete'),
    path('<int:sensor_id>/reagents/<int:reagent_id>/edit', views.sensors_reagent_edit, name='sensors_reagent_edit'),
    path('<int:sensor_id>/reagents/add', views.sensors_reagent_add, name='sensors_reagent_add'),
    path('<int:sensor_id>/reagents/update_valve', views.sensors_reagents_valve_update, name='update_valve'),
    path('<int:sensor_id>/reagents/reaction/add', views.sensors_reaction_add, name='reagent_reaction_add'),
    path('api/add_reaction', views.api_add_reaction, name='api_add_reaction'),
]