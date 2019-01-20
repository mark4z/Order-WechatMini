from django.urls import path

from . import views

urlpatterns = [
    path('<int:desk>/add/', views.add_menu),
    path('<int:desk>/del/', views.del_menu),
    path('<int:desk>/clean/', views.clean_menu),
    path('<int:desk>/', views.get_menu),
]
