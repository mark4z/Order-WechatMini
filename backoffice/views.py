import datetime
import json

from django.core import serializers
from django.core.paginator import Paginator
from django.http import HttpResponse
from django.shortcuts import render

# Create your views here.
from Data.models import Order
from backoffice.forms import NameForm


def index(request):
    return render(request, 'backoffice/index.html', {})


def order_list(request, page):
    list = Order.objects.all().order_by('-Time')
    paginator = Paginator(list, 10)
    json_list = []
    for i in paginator.get_page(page):
        json_list.append({
            'id': int(i.OrderId), 'user': i.User.Name, 'time': i.Time.strftime("%Y/%m/%d %H:%M:%S"),
            'desk': str(i.Desk), 'total': float(i.Total),
            'order_status': i.get_OrderState_display()})
    result = {'total': list.__len__(), 'detail': json_list}
    return HttpResponse(json.dumps(result))


def get_order(request, order_id):
    order = Order.objects.get(pk=order_id)
    menus = []
    for i in order.orderdetail_set.all():
        menus.append({"name": i.menu.Name,
                      "img": str(i.menu.Img),
                      "price": float(i.Price),
                      "num": i.Number})
    result = {'id': int(order.OrderId), 'user': order.User.Name, 'time': order.Time.strftime("%Y/%m/%d %H:%M:%S"),
              'desk': str(order.Desk), 'total': float(order.Total), 'cook_status': order.get_CookState_display(),
              'order_status': order.get_OrderState_display(), "detail": menus}
    return HttpResponse(json.dumps(result))
