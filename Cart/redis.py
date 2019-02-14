from django.core.cache import cache
from django.core import serializers
import json

from Data.models import Menu


def creat_detail(desk, name, num):
    return {
        "desk": desk,
        "name": name,
        "num": num,
    }


def set_cache(detail):
    cache_list = cache.get_or_set(detail['desk'], [])
    # 计算数量
    flag = 1
    for i in cache_list:
        if i['name'] == detail['name']:
            i['num'] = int(i['num']) + 1
            flag = 0
    if flag:
        cache_list.append(detail)
    # 计算单价
    for i in cache_list:
        i['price'] = float(Menu.objects.get(Name=i['name']).Price)*i['num']
    cache.set(detail['desk'], cache_list, 60 * 30)


def del_cache(detail):
    cache_list = cache.get_or_set(detail["desk"], [])
    for i in cache_list:
        if i['name'] == detail['name']:
            if i['num'] > 1:
                i['num'] = int(i['num']) - 1
            else:
                cache_list.remove(i)
    # 计算单价
    for i in cache_list:
        i['price'] = float(Menu.objects.get(Name=i['name']).Price)*i['num']
    cache.set(detail['desk'], cache_list, 60 * 30)


def clean_cache(desk):
    cache.delete(desk)


def get_cache(desk):
    return cache.get_or_set(desk, [])
