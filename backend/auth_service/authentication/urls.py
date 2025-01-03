from django.urls import path
from .views import RegisterView, LoginView, SetMFAFlagView, SaveProfilePicture, GetUserData, UpdateDisplayName, CheckUserExistence

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('setmfaflag/', SetMFAFlagView.as_view(), name='setmfaflag'),
    path('save_profile_pic/', SaveProfilePicture.as_view(), name='save_profile_pic'),
    path('get_user_data/', GetUserData.as_view(), name='get_user_data'),
    path('check_user_existence/', CheckUserExistence.as_view(), name='check_user_existence'),
    path('update_displayname/', UpdateDisplayName.as_view(), name='update_displayname')
]
