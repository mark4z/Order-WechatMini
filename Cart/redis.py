from django_redis import get_redis_connection
from django.core.cache import cache


class Redis:
    con = get_redis_connection("default")

    def set_cache(self, desk, name, num):
        pass

    def get_cache(self, desk):
        pass

    def del_cache(self, desk):
        pass

    def creat_order_detail(self, desk):
        for i in self.get_cache(desk):
            pass
        self.del_cache(desk)
