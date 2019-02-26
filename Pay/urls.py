from django.urls import path

from . import views
from django.conf.urls import url

urlpatterns = [
    path('login/', views.login, name='login'),
    path('<str:order_id>/', views.wxpay, name='pay'),
    path('<str:order_id>/success/', views.pay_success, name='paySuccess'),
]
