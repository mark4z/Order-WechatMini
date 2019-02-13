from django.http import HttpResponse
from django.core import serializers
from Cart import redis

# Create your views here.
from Data.models import Menu, MenuType, Order, Desk, User, OrderDetail


def get_menu_type(request):
    data=MenuType.objects.prefetch_related('menu_set').all()
    result=''
    for i in data:
        str='{"name":"'+i.Name+'","fields":'+serializers.serialize('json', i.menu_set.all())+"}"
        result+=()
    return HttpResponse("["+result+"]")


def get_menu(request):
    return HttpResponse(serializers.serialize('json', Menu.objects.all()))


def get_order(request, order_id):
    return HttpResponse(serializers.serialize('json', Order.objects.filter(pk=order_id)))


def set_order(request):
    # 获取参数
    order_id = request.POST['id']
    user = User.objects.get(OpenId=request.POST.get('open_id'))
    desk = Desk.objects.get(DeskMum=request.POST.get('desk'))
    comments = request.POST['comments']
    Order.objects.create(OrderId=order_id, User=user, Desk=desk, Comments=comments)
    # save cache in redis
    order = Order.objects.get(order_id=order_id)
    total = 0
    for i in redis.get_cache(desk):
        menu = Menu.objects.get(i['name'])
        OrderDetail.objects.create(menu=menu, order=order, Number=i['num'])
        total += menu.Price * i['num']
    order.Total = total
    order.save()
