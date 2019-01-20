from django.urls import path

from . import views

urlpatterns = [
    path('add/', views.add_menu),
    path('del/', views.del_menu),
    path('clean/', views.clean_menu),
    path('<int:desk>/', views.get_menu),
]
