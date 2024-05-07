from django.urls import path
from . import views

urlpatterns = [
    path('list/', views.sensors_list, name='sensors_list'),
    path('add/', views.sensors_add, name='sensors_add'),
    path('<int:id>/manual/', views.sensors_manual, name='sensors_manual'),
    path('<int:id>/deploy/', views.sensors_deploy, name='sensors_deploy'),
    path('<int:id>/data/', views.sensors_data, name='sensors_data'),
    path('<int:id>/settings/', views.sensors_settings, name='sensors_settings'),
    path('<int:id>/reagents/', views.sensors_reagents, name='sensors_reagents'),
    path('<int:id>/reagents/<int:reagent_id>/delete', views.sensors_reagent_delete, name='sensors_reagent_delete'),
    path('<int:id>/reagents/<int:reagent_id>/edit', views.sensors_reagent_edit, name='sensors_reagent_edit'),
    path('<int:id>/reagents/update_valve', views.sensors_reagents_valve_update, name='update_valve'),
]