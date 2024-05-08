from django.shortcuts import render
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
