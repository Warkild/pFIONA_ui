from django.urls import path
from django.contrib.auth import views as auth_views
from . import views

urlpatterns = [
    path('login/', auth_views.LoginView.as_view(template_name='pFIONA_auth/login.html'), name='login'),
    path('logout/', auth_views.LogoutView.as_view(template_name='pFIONA_auth/logged_out.html'), name='logout'),
    path('jwt/', views.get_jwt_tokens, name='get_jwt_tokens'),
    path('change-password/', views.ChangePasswordView.as_view(), name='change_password'),
]