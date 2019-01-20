from django.urls import path

from . import views

urlpatterns = [
    path('Menu/', views.get_menu),
    path('MenuType/', views.get_menu_type),
    path('Order/<int:order_id>/', views.get_order),
]
