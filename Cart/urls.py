from django.urls import path

from . import views
from django.conf.urls import url

urlpatterns = [
    path('', views.index, name='index'),
    url(r'^(?P<room_name>[^/]+)/$', views.room, name='room'),
    path('<int:desk>/add/', views.add_menu),
    path('<int:desk>/del/', views.del_menu),
    path('<int:desk>/clean/', views.clean_menu),
    path('<int:desk>/', views.get_menu),
]
