from django.urls import path
from . import views

urlpatterns = [
    path('list/', views.sensors_list, name='sensors_list'),
]