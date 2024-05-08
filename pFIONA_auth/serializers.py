from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['sub'] = user.username

        groups = [group.name for group in user.groups.all()]
        token['user_type'] = groups

        print(token)

        return token
