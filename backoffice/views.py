import datetime
import json
import time

from django.core import serializers
from django.core.paginator import Paginator
from django.db import transaction
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


@transaction.atomic()
def creat_order(request):
    data = json.loads(request.body)
    # 获取参数
    order_id = int(round(time.time() * 1000));
    user = User.objects.get(OpenId='guest')
    desk = Desk.objects.get(DeskMum=data['desk'])
    comments = data['comments']
    order_state = data['pay']
    cook_state = data['cook']
    Order.objects.create(OrderId=order_id, User=user, Desk=desk, Comments=comments, OrderState=order_state,
                         CookState=cook_state)
    # save cache in redis
    order = Order.objects.get(OrderId=order_id)
    total = 0
    for i in data['menus']:
        menu = Menu.objects.get(Name=i['menu']['name'])
        OrderDetail.objects.create(menu=menu, order=order, Number=i['menu']['value'])
        total += menu.Price * i['menu']['value']
    order.Total = total
    order.save()
    return HttpResponse("Access")


def revenue(request, a, y, m, d):
    global order_list_revenue
    result = None
    today = datetime.datetime.utcnow()
    total = 0
    wechat = 0
    alipay = 0
    cash = 0
    data_list = []
    if a == "today":
        order_list_revenue = Order.objects.filter(Time__year=today.year, Time__month=today.month, Time__day=today.day)
    if a == "month":
        order_list_revenue = Order.objects.filter(Time__year=y, Time__month=m)
        for i in range(1, 32):
            day_total = 0
            for j in order_list_revenue:
                if j.Time.day == i:
                    day_total += int(j.Total)
            data_list.append({"day": i, "value": day_total})
    if a == "year":
        order_list_revenue = Order.objects.filter(Time__year=y)
        for i in range(1, 13):
            month_total = 0
            for j in order_list_revenue:
                if j.Time.month == i:
                    month_total += int(j.Total)
            data_list.append({"month": i, "value": month_total})
    for i in order_list_revenue:
        if i.OrderState == "1":
            wechat += float(i.Total)
        if i.OrderState == "2":
            alipay += float(i.Total)
        if i.OrderState == "3":
            cash += float(i.Total)
        total += float(i.Total)
    result = {"total": total, "list": data_list,
              "circle": [{"name": "微信", "value": wechat}, {"name": "支付宝", "value": alipay},
                         {"name": "现金", "value": cash}]}
    return HttpResponse(json.dumps(result))
