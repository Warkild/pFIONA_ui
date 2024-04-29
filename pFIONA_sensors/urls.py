from django.urls import path
from . import views

urlpatterns = [
    path('list/', views.sensors_list, name='sensors_list'),
    path('add/', views.sensors_add, name='sensors_add'),
    path('<int:id>/manual/', views.sensors_manual, name='sensors_manual'),
]