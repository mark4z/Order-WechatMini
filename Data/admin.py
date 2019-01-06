from django.contrib import admin
from django.contrib.admin import ModelAdmin

from .models import *

admin.site.register(User)
admin.site.register(Desk)
admin.site.register(MenuType)
admin.site.register(Menu)


class OrderDetailInline(admin.TabularInline):
    model = OrderDetail
    extra = 2


class OrderAdmin(admin.ModelAdmin):
    inlines = (OrderDetailInline,)


admin.site.register(Order, OrderAdmin)
admin.site.register(OrderDetail)
admin.site.register(Expenses)
