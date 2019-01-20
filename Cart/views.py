from django.http import HttpResponse
from . import redis


def add_menu(request):
    detail = redis.creat_detail(request.POST.get('desk'), request.POST.get('name'), request.POST.get('num'))
    redis.set_cache(detail)
    return HttpResponse()


def del_menu(request):
    detail = redis.creat_detail(request.POST.get('desk'), request.POST.get('name'), request.POST.get('num'))
    redis.del_cache(detail)
    return HttpResponse()


def clean_menu(request, desk):
    redis.clean_cache(desk)
    return HttpResponse()


def get_menu(request, desk):
    return HttpResponse(redis.get_cache(desk))

