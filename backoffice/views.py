import datetime
import json
import time

from django.core import serializers
from django.core.paginator import Paginator
from django.http import HttpResponse
from django.shortcuts import render

# Create your views here.
from Data.models import Order, User, Desk, Menu, OrderDetail
from backoffice.forms import NameForm


def index(request):
    return render(request, 'backoffice/index.html', {})


def order_list(request, page):
    list = Order.objects.all().order_by('-Time')
    paginator = Paginator(list, 10)
    json_list = []
    for i in paginator.get_page(page):
        menus = []
        for j in i.orderdetail_set.all():
            menus.append({"name": j.menu.Name,
                          "img": str(j.menu.Img),
                          "price": float(j.Price),
                          "num": j.Number})
        json_list.append({
            'id': int(i.OrderId), 'user': i.User.Name, 'time': i.Time.strftime("%Y/%m/%d %H:%M:%S"),
            'desk': str(i.Desk), 'total': float(i.Total),
            'order_status': i.get_OrderState_display(), 'comments': i.Comments,
            'cook_status': i.get_CookState_display(), 'menus': menus})
    result = {'total': list.__len__(), 'detail': json_list}
    return HttpResponse(json.dumps(result))


def creat_order(request):
    # 获取参数
    order_id = int(round(time.time() * 1000));
    user = User.objects.get(OpenId='guest')
    desk = Desk.objects.get(DeskMum=int(request.POST['desk']))
    comments = request.POST['comments']
    Order.objects.create(OrderId=order_id, User=user, Desk=desk, Comments=comments)
    # save cache in redis
    order = Order.objects.get(OrderId=order_id)
    total = 0
    for i in order_id:
        menu = Menu.objects.get(Name=i['name'])
        OrderDetail.objects.create(menu=menu, order=order, Number=i['num'])
        total += menu.Price * i['num']
    order.Total = total
    order.save()
    return HttpResponse("Access")
