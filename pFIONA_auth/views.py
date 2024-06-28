from django.contrib.auth.decorators import login_required
from django.contrib.auth.forms import PasswordChangeForm
from django.contrib.auth.mixins import LoginRequiredMixin
from django.contrib.auth.views import PasswordChangeView
from django.shortcuts import render
from django.urls import reverse_lazy
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from pFIONA_auth.serializers import CustomTokenObtainPairSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_jwt_tokens(request):
    print(request.user)

    # JWT Token Loading

    refresh = RefreshToken.for_user(request.user)
    serializer = CustomTokenObtainPairSerializer()
    token = serializer.get_token(request.user)

    access_token = str(token)
    refresh_token = str(refresh)

    return Response({
        'access_token': access_token,
        'refresh_token': refresh_token
    }, status=status.HTTP_200_OK)


class ChangePasswordView(LoginRequiredMixin,PasswordChangeView):
    form_class = PasswordChangeForm
    success_url = reverse_lazy('sensors_list')
    template_name = 'pFIONA_auth/change_password.html'
