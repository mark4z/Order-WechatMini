from django.http import HttpResponse
from django.core import serializers

# Create your views here.
from Data.models import Menu, MenuType, Order, Desk, User


def get_menu_type(request):
    return HttpResponse(serializers.serialize('json', MenuType.objects.all()))


def get_menu(request):
    return HttpResponse(serializers.serialize('json', Menu.objects.all()))


def get_order(request, order_id):
    return HttpResponse(serializers.serialize('json', Order.objects.filter(pk=order_id)))


def set_order(request):
    order_id = request.POST['id']
    user = User.objects.get(OpenId=request.POST.get('open_id'))
    desk = Desk.objects.get(DeskMum=request.POST.get('desk'))
    total = request.POST['total']
    pay_total = request.POST['payTotal']
    comments = request.POST['comments']
    Order.objects.create(OrderId=order_id, User=user, Desk=desk, Total=total, PayTotal=pay_total, Comments=comments)
    #save cache in redis
