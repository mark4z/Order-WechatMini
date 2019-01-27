from django.urls import path

from . import views
from django.conf.urls import url

urlpatterns = [
    path('login/', views.login, name='login'),
]
