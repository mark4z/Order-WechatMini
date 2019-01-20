from django.core.cache import cache
from django.core import serializers
import json


def creat_detail(desk, name, num):
    return {
        'desk': desk,
        'name': name,
        'num': num
    }


def set_cache(detail):
    cache_list = cache.get_or_set(detail['desk'], [], 60 * 30)
    if detail in cache_list:
        detail['num'] += 1
    else:
        cache_list.append(detail)


def del_cache(detail):
    cache_list = cache.get_or_set(detail['desk'], [])
    if detail in cache_list:
        detail['num'] -= 1


def clean_cache(desk):
    cache.delete(desk)


def get_cache(desk):
    return cache.get(desk)
