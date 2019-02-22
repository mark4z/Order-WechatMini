from django.db import models
from django.db.models import Sum
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.html import format_html
from django.core import serializers


class MenuType(models.Model):
    Name = models.CharField('菜品分类', max_length=50, primary_key=True)
    Sort = models.DecimalField('排序', max_digits=20, decimal_places=0, default=0)

    def __str__(self):
        return self.Name

    class Meta:
        verbose_name_plural = '菜品分类'


class Menu(models.Model):
    Name = models.CharField('菜名', max_length=50, primary_key=True)
    Type = models.ForeignKey(MenuType, null=True, on_delete=models.CASCADE, verbose_name='菜品分类', related_name='Menus')
    Price = models.DecimalField('价格', max_digits=5, decimal_places=2)
    Img = models.ImageField('照片', upload_to='img')
    Introduction = models.CharField('简介', max_length=50)

    def __str__(self):
        return self.Name

    class Meta:
        verbose_name_plural = '菜单'


class User(models.Model):
    OpenId = models.CharField('用户id', max_length=50, primary_key=True)
    Name = models.CharField('昵称', max_length=50)
    Session = models.CharField('session', max_length=50)

    def __str__(self):
        return self.Name

    class Meta:
        verbose_name_plural = '用户'


class Desk(models.Model):
    DeskMum = models.DecimalField('桌号', max_digits=5, decimal_places=0, primary_key=True)

    def __str__(self):
        return str(self.DeskMum)

    class Meta:
        verbose_name_plural = '桌号'


class Order(models.Model):
    State_CHOICES = (
        ('0', '未付款'),
        ('1', '微信'),
        ('2', '支付宝'),
        ('3', '现金'),
    )
    Cook_CHOICES = (
        ('1', '已做'),
        ('0', '未做'),
    )
    Off = (
        ('1', '原价'),
        ('0.98', '98折'),
        ('0.88', '88折'),
    )
    OrderId = models.DecimalField('订单号', max_digits=20, decimal_places=0, primary_key=True)
    User = models.ForeignKey(User, null=False, to_field='OpenId', on_delete=models.DO_NOTHING, verbose_name='用户')
    Desk = models.ForeignKey(Desk, null=False, on_delete=models.DO_NOTHING, verbose_name='桌号')
    Time = models.DateTimeField(auto_now_add=True, verbose_name='时间')
    Total = models.DecimalField('总金额', max_digits=10, decimal_places=2, default=0)
    Off = models.CharField(max_length=6, choices=Off, verbose_name='折扣', default='1')
    PayTotal = models.DecimalField('实付金额', max_digits=10, decimal_places=2, default=0)
    OrderState = models.CharField(max_length=6, choices=State_CHOICES, verbose_name='付款状态', default='未付款')
    CookState = models.CharField(max_length=6, choices=Cook_CHOICES, verbose_name='后厨状态', default='0')
    Comments = models.CharField(max_length=200, verbose_name='备注', default='无')
    Menus = models.ManyToManyField(Menu, through='OrderDetail')

    def __str__(self):
        return str(self.OrderId)

    class Meta:
        verbose_name_plural = '订单'
        ordering = ["Time"]


class OrderDetail(models.Model):
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE)
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    Number = models.IntegerField('数量', default=1)
    Price = models.DecimalField('单价', null=True, max_digits=5, decimal_places=2, default=0)

    def save(self, *args, **kwargs):
        self.Price = Menu.objects.get(Name=self.menu).Price
        super().save(*args, **kwargs)

    class Meta:
        verbose_name_plural = '订单详情'

    def __str__(self):
        return str(self.menu)


class Expenses(models.Model):
    Name = models.CharField('备注', max_length=50, default="采购")
    Time = models.DateTimeField(verbose_name='时间')
    Price = models.DecimalField('金额', max_digits=10, decimal_places=2)

    class Meta:
        verbose_name_plural = '支出'
