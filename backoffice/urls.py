from django.urls import path

from . import views
from django.conf.urls import url

urlpatterns = [
    path('', views.index, name='index'),
    path('order_list/<int:page>', views.order_list, name='order_list'),
    path('order/<str:order_id>/', views.get_order),
]
