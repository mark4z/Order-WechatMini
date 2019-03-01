from django.contrib import admin
from .models import *

admin.site.site_header = '小程序后台管理'
admin.site.register(User)
admin.site.register(Desk)
admin.site.register(MenuType)
admin.site.register(OrderDetail)


@admin.register(Expenses)
class ExpensesAdmin(admin.ModelAdmin):
    list_display = ('Time', 'Price')
    search_fields = ('Time', 'Price')
    list_per_page = 10
    date_hierarchy = 'Time'
    list_filter = ('Time',)  # 过滤器


@admin.register(Menu)
class MenuAdmin(admin.ModelAdmin):
    search_fields = ['Name']


class OrderDetailInline(admin.TabularInline):
    model = OrderDetail
    extra = 1
    fields = ('menu', 'Number', 'Price')
    autocomplete_fields = ['menu']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    inlines = (OrderDetailInline,)
    list_display = ('colored_status','Desk', 'User', 'Total', 'Off', 'PayTotal', 'Time', 'CookState','OrderState')
    list_editable = ['CookState','OrderState']
    list_per_page = 10
    list_filter = ('OrderState', 'Desk')
    date_hierarchy = 'Time'
    search_fields = ('OrderId',)

    def save_related(self, request, form, formsets, change):
        super().save_related(request, form, formsets, change)
        try:
            orderId = request.POST.get('OrderId')
            OrderObj = Order.objects.get(OrderId=orderId)
            total = 0
            for i in OrderDetail.objects.filter(order=Order.objects.get(OrderId=orderId)):
                total += i.Price * i.Number
            OrderObj.Total = total
            OrderObj.save()
        except:
            pass
