import re

from django.contrib import admin
from django import forms

from .models import *

admin.site.site_header = '小程序后台管理'
admin.site.register(User)
admin.site.register(Desk)
admin.site.register(MenuType)
admin.site.register(Menu)


class OrderDetailInline(admin.TabularInline):
    model = OrderDetail
    extra = 1


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    inlines = (OrderDetailInline,)

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        orderId=request.POST.get('OrderId')
        OrderObj=Order.objects.get(OrderId=orderId)
        total=0;
        for i in OrderDetail.objects.filter(order=Order.objects.get(OrderId=orderId)):
            total+=i.Price*i.Number
        OrderObj.Total=total
        OrderObj.save()


admin.site.register(OrderDetail)
admin.site.register(Expenses)
