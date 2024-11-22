import requests
from django.contrib.auth.models import User
from .models import UserProfile
from rest_framework import exceptions, authentication


class JWTAuthentication(authentication.BaseAuthentication):
    """
    Custom JWT Authentication class to authenticate user via header Bearer token
    """
    def authenticate(self, request):
        access_token = request.COOKIES.get('access_token')
        if not access_token:
            raise exceptions.AuthenticationFailed("access token is missing")

        auth_service_url = "http://authservice:8000/api/auth/token/verify/"

        try:
            response = requests.post(auth_service_url, json={"token": access_token})
            if response.status_code == 200:
                token_data = response.json()
                username = token_data.get("username")
                user_id = token_data.get("user_id")

                user, created = User.objects.get_or_create(
                    id=user_id,
                    username=username
                )
                UserProfile.objects.get_or_create(user=user)
                request.token_data = token_data
                return user, None
            else:
                raise exceptions.AuthenticationFailed("Token verification failed with auth service")
        except requests.exceptions.RequestException as e:
            raise exceptions.AuthenticationFailed(f"Auth service unavailable: {str(e)}")