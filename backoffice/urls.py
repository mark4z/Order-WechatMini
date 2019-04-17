from django.urls import path
from django.views.generic import TemplateView

from . import views
from django.conf.urls import url

urlpatterns = [
    path('', views.index),
    path('order_list/<int:page>', views.order_list, name='order_list'),
    path('create_order/', views.creat_order, name='create_order'),
    path('revenue/<str:a>/<int:y>/<int:m>/<int:d>/', views.revenue),
]
