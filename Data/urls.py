from django.urls import path

from . import views

urlpatterns = [
    path('Cache/<str:desk>', views.get_cache),
    path('MenuType/', views.get_menu_type),
    path('Order/<int:order_id>/', views.get_or_creat_order),
]
