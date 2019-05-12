# Order-WechatMini
#后端
##Cart- 购物车
###View.py-控制器层
```python
import json
from django.http import HttpResponse
from django.shortcuts import render
from django.utils.safestring import mark_safe
from . import redis


def index(request):
    return render(request, 'Cart/index.html', {})


def room(request, room_name):
    return render(request, 'Cart/room.html', {
        'room_name_json': mark_safe(json.dumps(room_name))
    })


def add_menu(request, desk):
    detail = redis.creat_detail(desk, request.POST.get('name'), str(request.POST.get('num')))
    redis.set_cache(detail)
    return HttpResponse()


def del_menu(request, desk):
    detail = redis.creat_detail(desk, request.POST.get('name'), str(request.POST.get('num')))
    redis.del_cache(detail)
    return HttpResponse()


def clean_menu(request, desk):
    redis.clean_cache(desk)
    return HttpResponse()


def get_menu(request, desk):
    return HttpResponse(redis.get_cache(desk))

```
###consumers.py websocket 加减商品到购物车
```python
from asgiref.sync import async_to_sync
from channels.generic.websocket import WebsocketConsumer
import json
from . import redis


class ChatConsumer(WebsocketConsumer):
    def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = 'chat_%s' % self.room_name

        # Join room group
        async_to_sync(self.channel_layer.group_add)(
            self.room_group_name,
            self.channel_name
        )

        self.accept()

    def disconnect(self, close_code):
        # Leave room group
        async_to_sync(self.channel_layer.group_discard)(
            self.room_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json['message']
        cache_list = json.loads(message)

        desk = int(self.scope['url_route']['kwargs']['room_name'])

        # 处理请求
        if cache_list['action'] == "+":
            redis.set_cache(cache_list['detail'])
        if cache_list['action'] == "-":
            redis.del_cache(cache_list['detail'])
        if cache_list['action'] == "*":
            redis.clean_cache(desk)

        # Send message to room group
        async_to_sync(self.channel_layer.group_send)(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': redis.get_cache(desk)
            }
        )

    # Receive message from room group
    def chat_message(self, event):
        message = event['message']

        # Send message to WebSocket
        self.send(text_data=json.dumps({
            'message': json.dumps(message)
        }))

```
###url 路由
```python
from django.urls import path

from . import views
from django.conf.urls import url

urlpatterns = [
    path('', views.index, name='index'),
    url(r'^(?P<room_name>[^/]+)/$', views.room, name='room'),
    path('<int:desk>/add/', views.add_menu),
    path('<int:desk>/del/', views.del_menu),
    path('<int:desk>/clean/', views.clean_menu),
    path('<int:desk>/', views.get_menu),
]
```
##Data ORM表结构和核心数据（菜单和订单）
###models.py 表结构
```python
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
    MRP = models.DecimalField('积分', default=0, decimal_places=0,max_digits=10)

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
    OrderState = models.CharField(max_length=6, choices=State_CHOICES, verbose_name='付款状态', default='0')
    CookState = models.CharField(max_length=6, choices=Cook_CHOICES, verbose_name='后厨状态', default='0')
    Comments = models.CharField(max_length=200, verbose_name='备注', default='无')
    Menus = models.ManyToManyField(Menu, through='OrderDetail')

    def __str__(self):
        return str(self.OrderId)

    def colored_status(self):
        if self.OrderState == '0':
            color_code = 'red'
        else:
            color_code = 'green'
        return format_html(
            '<span style="color: {};">{}</span>',
            color_code,
            self.OrderId,
        )

    colored_status.short_description = '订单号'

    class Meta:
        verbose_name_plural = '订单'
        ordering = ["-Time"]


class OrderDetail(models.Model):
    menu = models.ForeignKey(Menu, on_delete=models.CASCADE)
    order = models.ForeignKey(Order, on_delete=models.CASCADE)
    Number = models.IntegerField('数量', default=1)
    Price = models.DecimalField('单价快照', null=True, max_digits=5, decimal_places=2, default=0)

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

```
###views.py 核心数据
```python
import json
import time

from django.http import HttpResponse
from django.core import serializers
from Cart import redis

# Create your views here.
from Data.models import Menu, MenuType, Order, Desk, User, OrderDetail
import pickle


def get_menu_type(request):
    data = MenuType.objects.prefetch_related('Menus').order_by("Sort").all()
    result = []
    for i in data:
        menus = []
        for j in i.Menus.all():
            menu = {
                'Name': j.Name,
                'Price': float(j.Price),
                'Img': str(j.Img),
                'Info': str(j.Introduction)
            }
            menus.append(menu)
        data = {
            'Name': i.Name,
            'Menus': menus
        }
        result.append(data)
    return HttpResponse(json.dumps(result))


def get_cache(request, desk):
    cache_list = redis.get_cache(desk)
    for i in cache_list:
        i['img'] = str(Menu.objects.get(Name=i['name']).Img)
    order_id = int(round(time.time() * 1000))
    result = {"id": order_id, "detail": cache_list}
    return HttpResponse(json.dumps(result))


def get_order(request, order_id):
    order = Order.objects.get(pk=order_id)
    menus = []
    for i in order.orderdetail_set.all():
        menus.append({"name": i.menu.Name,
                      "img": str(i.menu.Img),
                      "price": float(i.Price),
                      "num": i.Number})
    result = {"pk": order_id, "comments": str(order.Comments), "Total": float(order.Total), "detail": menus}
    return HttpResponse(json.dumps(result))


def set_order(request, order_id):
    # 获取参数
    user = User.objects.get(OpenId=request.POST['open_id'])
    desk = Desk.objects.get(DeskMum=int(request.POST['desk']))
    comments = request.POST['comments']
    Order.objects.create(OrderId=order_id, User=user, Desk=desk, Comments=comments)
    # save cache in redis
    order = Order.objects.get(OrderId=order_id)
    total = 0
    for i in redis.get_cache(desk):
        menu = Menu.objects.get(Name=i['name'])
        OrderDetail.objects.create(menu=menu, order=order, Number=i['num'])
        total += menu.Price * i['num']
    order.Total = total
    order.save()
    redis.clean_cache(desk)
    return HttpResponse("Access")


def get_or_creat_order(request, order_id):
    if request.method == 'GET':
        return get_order(request, order_id)
    elif request.method == 'POST':
        return set_order(request, order_id)


def get_my_order(request, open_id):
    user = User.objects.get(OpenId=open_id)
    orders = Order.objects.filter(User=user).order_by('-Time')
    return HttpResponse(serializers.serialize('json', orders))



```
###url.py 路由
```python
from django.urls import path

from . import views

urlpatterns = [
    path('Cache/<str:desk>', views.get_cache),
    path('MenuType/', views.get_menu_type),
    path('Order/<int:order_id>/', views.get_or_creat_order),
    path('MyOrder/<str:open_id>/', views.get_my_order),
]

```
##Pay 微信支付模块
###views.py 支付核心代码
```python
import json
import urllib

from django.conf.locale import et
from django.http import HttpResponse
from django.shortcuts import render

# Create your views here.
from Data.models import User, Order
from wechatpy import WeChatPay


def login(request):
    code = request.GET.get("code")
    appid = 'wx789c583bc751f9af'
    secret = '0baeb3f631e7336beabee4e75d2c4098'
    url = 'https://api.weixin.qq.com/sns/jscode2session?appid=' + appid + '&secret=' + secret + '&js_code=' + code + '&grant_Type=authorization_code'
    response = urllib.request.urlopen(url)
    data = json.loads(response.read())
    # 将用户数据存入数据库
    openid = data.get('openid')
    session_key = data.get('session_key')
    username = request.GET.get("nickName")
    User.objects.update_or_create(defaults={'Name': username, 'Session': session_key}, OpenId=openid)
    return HttpResponse(openid)


# 统一下单支付接口
def wxpay(request, order_id):
    appid = 'wx789c583bc751f9af'  # 小程序ID
    Mch_key = '00000000000000000000000000000000'
    Mch_id = '1514858131'
    openid = request.GET.get('open_id')
    Total = int(Order.objects.get(OrderId=order_id).Total * 100)
    pay = WeChatPay(appid, Mch_key, Mch_id)
    order = pay.order.create(
        trade_type='JSAPI',  # 交易类型，小程序取值：JSAPI
        body='小食记',  # 商品描述，商品简单描述
        total_fee=Total,  # 标价金额，订单总金额，单位为分
        notify_url='https://www.qqmxd.com/login/payn/',  # 通知地址，异步接收微信支付结果通知的回调地址，通知url必须为外网可访问的url，不能携带参数。
        user_id=openid  # 用户标识，trade_type=JSAPI，此参数必传，用户在商户appid下的唯一标识。
    )
    wxpay_params = pay.jsapi.get_jsapi_params(order['prepay_id'])

    return HttpResponse(json.dumps(wxpay_params))


def wxpayNotify(request):
    _xml = request.body
    # 拿到微信发送的xml请求 即微信支付后的回调内容
    xml = str(_xml, encoding="utf-8")
    print("xml", xml)
    return_dict = {}
    tree = et.fromstring(xml)
    # xml 解析
    return_code = tree.find("return_code").text
    try:
        if return_code == 'FAIL':
            # 官方发出错误
            return_dict['message'] = '支付失败'
            # return Response(return_dict, status=status.HTTP_400_BAD_REQUEST)
        elif return_code == 'SUCCESS':
            # 拿到自己这次支付的 out_trade_no
            _out_trade_no = tree.find("out_trade_no").text
            # 这里省略了 拿到订单号后的操作 看自己的业务需求
    except Exception as e:
        pass


def pay_success(request, order_id):
    order = Order.objects.get(OrderId=order_id)
    order.OrderState = '1'
    order.save()

```
###url.py 路由
```python
from django.urls import path

from . import views
from django.conf.urls import url

urlpatterns = [
    path('login/', views.login, name='login'),
    path('<str:order_id>/', views.wxpay, name='pay'),
    path('<str:order_id>/success/', views.pay_success, name='paySuccess'),
]

```



#小程序
###### js是业务逻辑 wxml是前端html wxss是css样式
##index 首页
###js
```javascript
//index.js
//获取应用实例
const app = getApp()
var static_url = app.globalData.url+"/Static"
Page({
  data: {
    img_urls: [
      static_url+"/index/1.jpg",
      static_url + "/index/2.jpg",
      static_url + "/index/3.jpg",
    ],
    index_img: static_url + "/index/4.jpg"
  },
  onLoad: function() {
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              app.globalData.userInfo = res.userInfo
              wx.login({
                success: res => {
                  // 发送 res.code 到后台换取 openId, sessionKey, unionId
                  // // 可以将 res 发送给后台解码出 unionId
                  wx.request({
                    url: app.globalData.url + "/Pay/login",
                    data: {
                      code: res.code,
                      nickName: app.globalData.userInfo.nickName
                    },
                    header: {
                      'content-type': 'application/json' // 默认值
                    },
                    success(res) {
                      app.globalData.open_id = res.data
                      console.log(app.globalData.open_id+"  Access")
                    },
                  })
                }
              })
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }else{
          wx.navigateTo({
            url: '../login/login'
          })
        }
      }
    })
  },
  Go:function(){
    wx.navigateTo({
      url: '/pages/carte/carte'
    })
  }
})
```
###wxml
```html
<view class='swiper'>
  <swiper autoplay='true' circular='true'>
    <block wx:for="{{img_urls}}" wx:key="*this">
      <swiper-item>
        <image src="{{item}}" class="slide-image" height="150" />
      </swiper-item>
    </block>
  </swiper>
</view>

<view class='btn-bar'>
  <button class='btn_start' bindtap='Go'>开始点餐</button>
  <button class='btn_start_disabled'>预约点餐</button>
</view>

<view class='div'>
<image class='index_img' src="{{index_img}}"/>
</view>
```
###wxss
```css
.swiper {
  margin-top: 2%;
  background-color: #fff;
  padding: 20rpx 0;
}

.slide-image {
  width: 100%;
  height: 100%;
}
.btn-bar{
  margin-top: 2%;
  display: flex;
}
.btn_start{
  text-align: center;
  font-size:30rpx;
  padding: 0rpx,20rpx;
  color:rgb(0, 0, 0);
  border:2rpx solid #B6D9A9;
  border-radius: 36rpx;
  width: 42%;
}
.btn_start_disabled{
  text-align: center;
  font-size:30rpx;
  padding: 0rpx,20rpx;
  color:rgb(196, 196, 196);
  border:2rpx solid #B6D9A9;
  border-radius: 36rpx;
  width: 42%;
}
.index_img{
  width: 100%;
  height: 800rpx;
}

```
##login 登陆
###js
```javascript
// pages/login/login.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    welcome: "欢迎来到小食记",
    guide: "点击下方按钮开始点餐吧！",
    begin: "开始",
  },

  onGotUserInfo: function(e) {
    console.log(e.detail.userInfo)
    wx.reLaunch({
      url: '../index/index'
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  }
})
```
###wxml
```html
<view class="container">
  <text class="user-welcome">{{welcome}}</text>
  <text class='user-guide'>{{guide}}</text>
</view>
<button open-type="getUserInfo" lang="zh_CN" bindgetuserinfo="onGotUserInfo" type="primary">{{begin}}</button>
```
###wxss
```css
/* pages/login/login.wxss */
.user-welcome{
  font-size: 60rpx;
}
button{
  width: 80%;
  color: rgb(148, 32, 32);
}
```
##Carte 列表和购物车
###js
```javascript
// pages/carte/carte.js
const app = getApp()
var static_url = app.globalData.url
var ip=app.globalData.ip
Page({

  /**
   * 页面的初始数据
   */
  data: {
    'static_url': app.globalData.url,
    'MenuType': [],
    'now_type': '',
    'Menus': [],
    'cart': [],
    'activeMenuType': 0,
    'cart_switch': 0,
    'detail_switch': 0,
    'cart_list': [],
    'list_price': 0,
    'list_num': 0,
    'menu_detail': null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this
    wx.request({
      url: static_url + '/Data/MenuType/',
      header: {
        'content-type': 'application/json' // 默认值
      },
      success(res) {
        that.setData({
          MenuType: res.data
        })
        that._observer = wx.createIntersectionObserver(that, {
          observeAll: true
        })
        that._observer
          .relativeTo('.link_target')
          .observe('.content_type', (res) => {
            if (that.activeMenuType != (res.id.split('list')[1])) {
              that.setData({
                activeMenuType: res.id.split('list')[1],
              })
            }
          })
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    wx.connectSocket({
      url: 'ws://' + ip + '/ws/Cart/' + app.globalData.desk + '/',
      //url: 'ws://' + ip + '/ws/Cart/' + app.globalData.desk + '/',
    })
    wx.onSocketOpen(
      function(res) {
        console.log('WebSocket连接已打开！')
        wx.request({
          url: static_url + "/Data/Cache/" + app.globalData.desk + "",
          header: {
            'content-type': 'application/json'
          },
          success(res) {
            that.setData({
              cart_list: res.data.detail,
            })
            var list = res.data.detail
            var num = 0
            var price = 0
            for (var j = 0, len = list.length; j < len; j++) {
              num += list[j].num
              price += list[j].price
            }
            that.setData({
              list_num: num,
              list_price: price
            })
          }
        })
      }
    )
    wx.onSocketClose(
      function(res) {
        console.log('WebSocket连接已关闭！')
      }
    )
    var that = this
    wx.onSocketMessage(function(res) {
      var list = JSON.parse(JSON.parse(res.data).message)
      that.setData({
        cart_list: list
      })
      var num = 0
      var price = 0
      for (var j = 0, len = list.length; j < len; j++) {
        num += list[j].num
        price += list[j].price
      }
      that.setData({
        list_num: num,
        list_price: price
      })
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {
    wx.closeSocket({})
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {},

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {},

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  },
  select_type: function(e) {
    var index = e.currentTarget.dataset.index
    this.setData({
      activeMenuType: index,
      now_type: 'list' + index,
    })
  },
  Cart: function() {
    if (this.data.cart_list.length > 0) {
      this.setData({
        cart_switch: !this.data.cart_switch,
      })
    } else {
      this.setData({
        cart_switch: 0
      })
    }
  },
  plus: function(event) {
    var that = this
    var name = event.currentTarget.dataset.name
    var action = event.currentTarget.dataset.action
    wx.sendSocketMessage({
      data: JSON.stringify({
        'message': JSON.stringify({
          "action": action,
          "detail": {
            "name": name,
            "num": 1,
            "desk": app.globalData.desk
          }
        })
      })
    })
    if (action == "*")
      this.setData({
        cart_switch: 0
      })
  },
  Order: function() {
    wx.navigateTo({
      url: '/pages/confirm/confirm'
    })
  },
  Detail: function(event) {
    if (this.data.detail_switch) {
      this.setData({
        detail_switch: 0
      })
    } else {
      var menu = event.currentTarget.dataset.that
      this.setData({
        detail_switch: 1,
        menu_detail: menu
      })
    }
  }
})
```
###wxml
```html
<view class='welcome'>
</view>
<view class='left-menu'>
  <view class="list-left-menu">
    <view wx:for="{{MenuType}}" wx:key="Sort" class="{{index==activeMenuType?'list-left-menu-box-selected':'list-left-menu-box-unselect'}}" data-index="{{index}}" bindtap='select_type'>
      <view class="list-menu-name">{{item.Name}}</view>
    </view>
  </view>
</view>
<view class='link_target'></view>
<scroll-view scroll-y='true' scroll-into-view='{{now_type}}' class='menu_list'>
  <view wx:for="{{MenuType}}" wx:key="Sort" wx:for-item="i" wx:for-index='j'>
    <view class='content_type' id='list{{j}}' index='{{j}}'>{{i.Name}}</view>
    <view class='content_list' wx:for="{{i.Menus}}" wx:key="Sort" wx:for-item="items">
      <view class='content_img' data-that='{{items}}' bindtap='Detail'>
        <image mode='widthFix' lazy-load='true' src='{{static_url}}/Static/{{items.Img}}'></image>
      </view>
      <view class='content_name' data-that='{{items}}' bindtap='Detail'>
        <view style='font-size:34rpx'>{{items.Name}}</view>
        <view style='color:red;font-size:32rpx'>¥ {{items.Price}}</view>
      </view>
      <view class='iconfont icon-plus icon-item' hover-class="icon-item_tap" data-name='{{items.Name}}' data-action='+' bindtap='plus'>
      </view>
    </view>
  </view>
  <view class='content_list_blank'></view>
</scroll-view>
<view>
  <view class='Cart' bindtap='Cart'>
    <image src='../../images/cart.png'></image>
    <view class='Cart_num'>{{list_num}}</view>
    <text wx:if="{{list_price}}" style='color:white;font-size:36rpx'>￥ {{list_price}}</text>
    <view style='position: absolute;right: 46rpx;color: gray;'>请点餐</view>
  </view>
  <button class='cart_pay' wx:if="{{list_price}}" hover-class="icon-item_tap" bindtap='Order'>
    <text>去结算</text>
  </button>
</view>
<view class='cover' wx:if="{{cart_switch}}" bindtap='Cart'></view>
<view class='cart_detail' animation="{{animation}}" wx:if="{{cart_switch}}">
  <view class='selected' style='font-size:36rpx'>
    <view class="move_left">已选商品</view>
    <view class="move_right" data-name='{{item.Name}}' data-action='*' bindtap='plus'>
      <icon class="iconfont icon-clean"></icon>
      清空
    </view>
  </view>
  <scroll-view scroll-y='true' class="{{cart_list.length>5?'cart_detail_list':''}}">
    <view class='selected_item' wx:for="{{cart_list}}" wx:key="">
      <view class='list_name move_left'>{{item.name}}</view>
      <view class='list_price' style='color:red;font-size:30rpx;'>¥ {{item.price}}</view>
      <view class='.selected_plus'>
        <view class='iconfont icon-minus icon-cart' hover-class="icon-item_tap" data-name='{{item.name}}' data-action='-' bindtap='plus'></view>
        <view>{{item.num}}</view>
        <view class='iconfont icon-plus icon-cart' hover-class="icon-item_tap" data-name='{{item.name}}' data-action='+' bindtap='plus'></view>
      </view>
    </view>
  </scroll-view>
  <view class='selected_blank'></view>
</view>
<view class='container cover' wx:if="{{detail_switch}}" bindtap='Detail'>
<view class='close iconfont icon-guanbi'></view>
</view>
<view class='menu_detail' wx:if="{{detail_switch}}">
  <view>{{menu_detail.Name}}</view>
  <view>
    <image class='menu_detail_img' mode='aspectFill' lazy-load='true' src='{{static_url}}/Static/{{menu_detail.Img}}'></image>
  </view>
  <view style='font-size:28rpx;'>{{menu_detail.Info}}</view>
  <view class='detail_bottom'>
    <view style="color:red;">￥{{menu_detail.Price}}</view>
    <view style='color: #008de1;' class='iconfont icon-plus' hover-class="icon-item_tap" data-name='{{menu_detail.Name}}' data-action='+' bindtap='plus' />
  </view>
</view>
```
###wxss
```css
/* pages/list/list.wxss */

.page {
  overflow-y: hidden;
}

.div {
  display: flex;
  flex-direction: row;
}

.welcome {
  width: 100%;
  height: 200rpx;
  background-color: #008de1;
}

.list-left-menu {
  width: 24%;
  height: 80%;
  background-color: #f9f9f9;
  font-size: 26rpx;
  position: absolute;
  left: 0px;
  z-index: 0;
}

.list-left-menu-box-unselect {
  padding: 15rpx;
  border-bottom: 0px solid #e3e3e3;
  height: 72rpx;
  color: #6c6c6c;
  background: #f9f9f9;
}

.list-left-menu-box-selected {
  padding: 15rpx;
  height: 72rpx;
  color: #e53085;
  border-left: 3px solid #e53085;
  background: white;
}

.content_type {
  font-size: 26rpx;
  font-weight: 100;
  margin: 4%;
}

.list-menu-name {
  text-align: center;
  margin-top: 20rpx;
}

.Cart {
  z-index: 16;
  top: 88%;
  margin-left: 2.5%;
  height: 6%;
  width: 95%;
  position: fixed;
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #2c2c2c;
  border: 1%;
  border-color: black;
  border-radius: 50rpx;
}

.Cart>image {
  width: 80rpx;
  height: 80rpx;
  margin-left: 20rpx;
}

.Cart_num {
  width: 40rpx;
  height: 40rpx;
  border: 1rpx;
  border-radius: 40rpx;
  color: white;
  position: relative;
  text-align: center;
  left: -18rpx;
  top: -22rpx;
  z-index: 20;
  background-color: red;
}

.Cart>text {
  margin-left: 10%;
  color: white;
}

.cart_pay {
  z-index: 16;
  top: 88%;
  position: fixed;
  right: 2.5%;
  background-color: #51d862;
  width: 186rpx;
  height: 6%;
  border: 1rpx;
  border-color: white;
  border-top-right-radius: 50rpx;
  border-bottom-right-radius: 50rpx;
  display: flex;
  align-items: center;
}

.Cart>button>text {
  margin-left: 6%;
  color: rgb(255, 255, 255);
  font-size: 36rpx;
}

.menu_list {
  position: absolute;
  left: 24%;
  width: 76%;
  height: 80%;
  z-index: 1;
  background-color: white;
}

.content_list {
  height: 160rpx;
  display: flex;
  border-bottom: 1px solid rgba(201, 200, 200, 0.315);
  flex-direction: row;
  align-content: center;
  align-items: center;
  margin-top: 1%;
}

.content_list_blank {
  height: 20%;
}

.content_img {
  width: 40%;
  margin-left: 4%;
  margin-right: 4%;
}

.content_img>image {
  width: 100%;
  border-radius: 10rpx;
}

.content_name {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-content: center;
  align-items: flex-start;
  justify-content: space-around;
}

.icon-item {
  margin: 4%;
  width: 20%;
  height: 80%;
  display: flex;
  align-content: flex-end;
  align-items: flex-end;
  color: #008de1;
}

.icon-item_tap {
  color: #676e72;
}

.link_target {
  position: absolute;
  top: 205rpx;
  right: 0rpx;
  width: 1000rpx;
  height: 20rpx;
  background-color: #fff;
  z-index: -1;
}

.cover {
  width: 100%;
  height: 100%;
  position: fixed;
  background-color: rgba(0, 0, 0, 0.226);
  z-index: 8;
}

.cart_detail {
  width: 100%;
  z-index: 9;
  position: fixed;
  flex-direction: column;
  bottom: 0%;
  align-content: center;
  align-items: center;
  background-color: white;
}

.cart_detail_list {
  height: 500rpx;
}

.selected {
  width: 100%;
  height: 16%;
  background-color: #eee;
  display: flex;
  flex-direction: row;
  align-content: center;
  align-items: center;
  justify-content: space-between;
}

.selected_blank {
  width: 100%;
  height: 180rpx;
  display: flex;
  background-color: #eee;
}

.selected_item {
  height: 102rpx;
  display: flex;
  flex-direction: row;
  align-content: center;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e3e3e3;
}

.selected_plus {
  width: 20%;
  display: flex;
  flex-direction: row;
  align-content: center;
  align-items: center;
  justify-content: space-between;
  position: relative;
  right: 20rpx;
}

.icon-cart {
  color: #008de1;
}

.list_name {
  width: 45%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 36rpx;
}

.move_left {
  position: relative;
  left: 20rpx;
}

.move_right {
  position: relative;
  right: 20rpx;
}

.menu_detail {
  position: absolute;
  bottom: 25%;
  left: 2.5%;
  width: 90%;
  height: 800rpx;
  background-color: white;
  z-index: 20;
  padding: 20rpx 20rpx 0 20rpx;
  border: 1rpx black;
  border-radius: 10rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.menu_detail_img {
  width: 100%;
  height: 500rpx;
  display: flex;
}

.detail_bottom {
  width: 100%;
  display: flex;
  flex-direction: row;
  align-content: center;
  align-items: center;
  justify-content: space-between;
}

.close {
  z-index: 20;
  position: fixed;
  bottom: 20%;
  align-self: center;
}

```

##confirm 下订单
###js
```javascript
// pages/confirm/confirm.js
const app = getApp()
var static_url = app.globalData.url
Page({

  /**
   * 页面的初始数据
   */
  data: {
    'static_url': app.globalData.url,
    'cache_list': null,
    'total': 0,
    'comments': '',
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    console.log(app.globalData)
    var that = this
    wx.request({
      url: static_url + "/Data/Cache/" + app.globalData.desk + "",
      header: {
        'content-type': 'application/json'
      },
      success(res) {
        console.log(res.data)
        var total = 0
        for (var i = 0; i < res.data.detail.length; i++) {
          total += res.data.detail[i].price
        };
        that.setData({
          cache_list: res.data,
          total: total,
        })
        app.globalData.order_id=res.data.id
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function() {},

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function() {

  },
  bindTextAreaBlur: function(e) {
    this.setData({
      comments: e.detail.value
    })
  },
  Order: function() {
    var that = this
    if (1) {
      wx.request({
        url: static_url + "/Data/Order/" + that.data.cache_list.id + "/",
        data: {
          desk: app.globalData.desk,
          open_id: app.globalData.open_id,
          comments: that.data.comments
        },
        method: 'POST',
        header: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        success(res) {
          console.log("下单成功！" + app.globalData.open_id)
          wx.navigateTo({
            url: '../pay/pay'
          })
        }
      })
    }
  },
})
```
###wxml
```html
<view class='page'>
  <view class='welcome'>
    <view class='h3'>请确认您的订单</view>
  </view>
  <view class='list'>
    <view class='list_head'>
      <text>订单： {{cache_list.id}}</text>
    </view>
    <block wx:for="{{cache_list.detail}}" wx:key="name" wx:for-item="i">
      <view class='list_detail'>
        <view class='detail_img'>
          <image mode='widthFix' lazy-load='true' src='{{static_url}}/Static/{{i.img}}'></image>
        </view>
        <view class='detail_name'>{{i.name}}</view>
        <view class='detail_num'>x{{i.num}}</view>
        <view style='font-size:32rpx'>￥{{i.price}}</view>
      </view>
    </block>
  </view>
  <view>
    <view class='comments'>
      <text>备注：</text>
    </view>
    <view class="textarea-wrp">
      <textarea bindblur="bindTextAreaBlur" auto-height />
    </view>
  </view>
  <view class='content_list_blank'></view>
</view>
<view class='Pay'>
  <text>合计：￥{{total}}</text>
  <button class='goPay' hover-class="icon-item_tap" bindtap='Order'>
    <text wx:if="{{cache_list.detail.length>0}}">提交订单</text>
  </button>
</view>
```
###wxss
```css
/* pages/confirm/confirm.wxss */

.page {
  height: 600rpx;
  background: linear-gradient(#008de1, #eee);
}

.welcome {
  width: 100%;
  height: 80rpx;
  color: white;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
}

.h3 {
  font-size: 48rpx;
}

.list {
  margin: 2%;
}

.list_head {
  padding: 20rpx;
  height: 46rpx;
  background-color: white;
  border-bottom: 1px solid #e3e3e3;
  font-size: 36rpx;
}

.list_detail {
  padding: 20rpx;
  height: 80rpx;
  background-color: white;
  display: flex;
  flex-direction: row;
  align-content: center;
  align-items: center;
  justify-content: space-between;
  font-size: 32rpx;
}

.detail_img {
  width: 20%;
}

.detail_img>image {
  width: 60%;
  border-radius: 10rpx;
}

.detail_num {
  position: absolute;
  right: 200rpx;
}

.detail_name {
  position: absolute;
  left: 150rpx;
}

.content_list_blank {
  height: 200rpx;
}

.Pay {
  z-index: 16;
  bottom: 0rpx;
  width: 100%;
  height: 8%;
  position: fixed;
  display: flex;
  flex-direction: row;
  align-items: center;
  background-color: #2c2c2c;
  color: white;
}

.Pay>text {
  margin-left: 3%;
}
.Pay>button{
  color: white;
  text-align: center;
  position: absolute;
  right:0rpx;
  width: 200rpx;
  background-color: #51d862;
}

.textarea-wrp {
  font-size: 36rpx;
  padding: 0 25rpx;
  background-color: #fff;
  margin-left: 2%;
  margin-right: 2%;
  height: 200rpx;
}

.comments {
  margin-left: 2%;
  margin-right: 2%;
  padding: 20rpx;
  height: 46rpx;
  background-color: white;
  border-bottom: 1px solid #e3e3e3;
  font-size: 36rpx;
}

```


##me 我的
###js
```javascript
// pages/me/me.js
const app = getApp()
var static_url = app.globalData.url
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      userInfo: app.globalData.userInfo,
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  list:function(){
    wx.navigateTo({
      url: '../orders/orders/orders'
    })
  }
})
```
###wxml
```html
<!--index.wxml-->
<view class="container">
  <view class="userinfo">
    <image class="userinfo-avatar" src="{{userInfo.avatarUrl}}" mode="cover"></image>
    <text class="userinfo-nickname">{{userInfo.nickName}}</text>
  </view>
  <button class='my_order' bindtap='list'>
    <view>我的订单</view>
    <view class='iconfont icon-jiantouyou'></view>
  </button>
</view>
```
###wxss
```css
/* pages/me/me.wxss *//**index.wxss**/
.userinfo {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.userinfo-avatar {
  width: 128rpx;
  height: 128rpx;
  margin: 20rpx;
  border-radius: 50%;
}

.userinfo-nickname {
  color: #aaa;
}
.my_order{
  width: 88%;
  height: 86rpx;
  background-color: white;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 40rpx;
}
```



#后台管理页面
###### backoffice文件夹里src-components或者views里的几个文件
##order_list.vue 订单列表
    <template>
        <div>
            <el-table
                    :data="tableData"
                    border
                    style="width: 100%"
                    :row-class-name="tableRowClassName">
                <el-table-column type="expand">
                    <template slot-scope="props">
                        <el-form label-position="left" inline class="demo-table-expand">
                            <el-form-item label="后厨状态">
                                <span>{{ props.row.cook_status}}</span>
                            </el-form-item>
                            <el-form-item label="备注">
                                <span>{{ props.row.comments}}</span>
                            </el-form-item>
                            <el-form-item label="菜单列表">
                                <el-table
                                        :data="props.row.menus">
                                    <el-table-column
                                            prop="name"
                                            label="图片">
                                        <template scope="scope">
                                            <img class="menu-img" :src="'/Static/'+scope.row.img"/>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                            prop="name"
                                            label="菜品">
                                    </el-table-column>
                                    <el-table-column
                                            prop="num"
                                            label="数量">
                                    </el-table-column>
                                    <el-table-column
                                            prop="price"
                                            label="价格">
                                        <template scope="scope">
                                            <span style="color: red"> ￥ {{scope.row.price*scope.row.num}}</span>
                                        </template>
                                    </el-table-column>
                                </el-table>
                            </el-form-item>
                        </el-form>
                    </template>
                </el-table-column>
                <el-table-column
                        prop="id"
                        label="订单号">
                </el-table-column>
                <el-table-column
                        prop="user"
                        label="用户">
                </el-table-column>
                <el-table-column
                        prop="time"
                        label="时间">
                </el-table-column>
                <el-table-column
                        prop="desk"
                        label="桌号"
                        width="60px">
                </el-table-column>
                <el-table-column
                        prop="total"
                        label="总金额"
                        width="100px">
                    <template slot-scope="scope">
                        <p style="color: red">￥ {{ scope.row.total }}</p>
                    </template>
                </el-table-column>
                <el-table-column
                        prop="order_status"
                        label="付款方式"
                        width="120px">
                </el-table-column>
            </el-table>
            <el-pagination
                    background
                    layout="prev, pager, next, jumper, ->, total, slot"
                    @current-change="CurrentChange"
                    :total="total"
                    :page-size="10">
            </el-pagination>
        </div>
    </template>
    
    <script>
        export default {
            name: "order_list",
            data() {
                return {
                    tableData: [],
                    total: 0
                }
            },
            created: function () {
                this.axios.get('/backoffice/order_list/1').then((response) => {
                    this.tableData = response.data.detail;
                    this.total = response.data.total;
                })
            },
            methods: {
                CurrentChange(page) {
                    this.axios.get('/backoffice/order_list/' + page).then((response) => {
                        this.tableData = response.data.detail;
                    })
                },
                tableRowClassName({row}) {
                    if (row.order_status == '未付款') {
                        return 'warning-row';
                    } else {
                        return 'success-row';
                    }
                },
                handleEdit(id) {
                    this.$router.push('/order_edit/' + id);
                },
            }
        }
    </script>
    
    
    <style>
        .menu-img {
            width: 50px;
            height: 50px;
        }
    
        .el-table .warning-row {
            background: oldlace;
        }
    
        .el-table .success-row {
            background: #f0f9eb;
        }
    
        .demo-table-expand {
            font-size: 0;
        }
    
        .demo-table-expand label {
            width: 90px;
            color: #99a9bf;
        }
    
        .demo-table-expand .el-form-item {
            margin-right: 0;
            margin-bottom: 0;
            width: 100%;
        }
    </style>
    

##menu_left.vue 侧边栏
    <template>
        <el-aside width="200px">
            <el-menu :default-openeds="['1','3']">
                <el-submenu index="1">
                    <template slot="title"><i class="el-icon-tickets"></i>订单</template>
                    <el-menu-item @click="go('/')" index="1">订单查看</el-menu-item>
                    <el-menu-item @click="go('/order_add')" index="2">创建订单</el-menu-item>
                    <el-menu-item @click="toAdmin()" index="3">订单管理</el-menu-item>
                </el-submenu>
                <el-submenu index="2">
                    <template slot="title"><i class="el-icon-edit-outline"></i>会员</template>
                    <el-menu-item index="1">会员管理</el-menu-item>
                </el-submenu>
                <el-submenu index="3">
                    <template slot="title"><i class="el-icon-message"></i>财务</template>
                    <el-menu-item index="1" @click="go('/today')">今日</el-menu-item>
                    <el-menu-item index="2" @click="go('/month')">月度</el-menu-item>
                    <el-menu-item index="3" @click="go('/year')">年度</el-menu-item>
                </el-submenu>
            </el-menu>
        </el-aside>
    </template>
    
    <script>
        export default {
            name: "menu_left",
            methods: {
                go(url) {
                    this.$router.push(url)
                },
                toAdmin() {
                    window.open("/admin")
                }
            }
    
        }
    </script>
    
    <style scoped>
        .el-aside {
            height: 650px;
            background-color: rgba(242, 242, 242, 0.7);
            box-shadow: 0 2px 4px rgba(0, 0, 0, .12), 0 0 6px rgba(0, 0, 0, .04)
        }
    </style>
    

##order_add.vue创建订单
    <template>
        <div>
            <h1>创建订单</h1>
            <el-row :gutter="20">
                <el-col :span="12">
                    <span>桌号：</span>
                    <el-select v-model="order.desk" placeholder="请选择" >
                        <el-option
                                v-for="item in desk"
                                :value="item"
                                :key="item.value">
                        </el-option>
                    </el-select>
                </el-col>
                <el-col :span="12">
                    <span>付款状态：</span>
                    <el-select v-model="order.pay" placeholder="请选择">
                        <el-option
                                :key="item.value"
                                v-for="item in pay"
                                :label="item.label"
                                :value="item.value">
                        </el-option>
                    </el-select>
                </el-col>
            </el-row>
            <el-row :gutter="20">
                <el-col :span="12">
                    <span>备注：</span>
                    <el-input style="width:80%;" v-model="order.comments" placeholder="请输入备注"></el-input>
                </el-col>
                <el-col :span="12">
                    <span>后厨状态：</span>
                    <el-select v-model="order.cook" placeholder="请选择">
                        <el-option
                                :key="item.value"
                                v-for="item in cook"
                                :label="item.label"
                                :value="item.value">
                        </el-option>
                    </el-select>
                </el-col>
            </el-row>
            <el-row>
                <el-col :span="12">
                    <el-table
                            :data="order.menus"
                            style="width: 50%;"
                            height="400px">
                        <el-table-column
                                prop="menu"
                                label="菜品">
                            <template slot-scope="scope">
                                <div class="fixed-cell">
                                    <el-badge :value="scope.row.menu.value">
                                        <el-button type="success" plain round>{{scope.row.menu.name}}</el-button>
                                    </el-badge>
                                </div>
                            </template>
                        </el-table-column>
                    </el-table>
                </el-col>
                <el-col :span="12">
                    <el-table
                            :data="menus"
                            style="width: 100%"
                            height="400px">
                        <el-table-column type="expand">
                            <template slot-scope="props">
                                <el-table :show-header="false"
                                          :data="props.row.Menus">
                                    <el-table-column
                                            prop="Img"
                                            label="图片">
                                        <template scope="scope">
                                            <img class="menu-img" :src="'/Static/'+scope.row.Img"/>
                                        </template>
                                    </el-table-column>
                                    <el-table-column
                                            prop="Name"
                                            label="菜品">
                                    </el-table-column>
                                    <el-table-column
                                            prop="price"
                                            label="单价">
                                        <template scope="scope">
                                            <span style="color: red"> ￥ {{scope.row.Price}}</span>
                                        </template>
                                    </el-table-column>
                                    <el-table-column label="操作">
                                        <template slot-scope="scope">
                                            <el-button
                                                    size="mini"
                                                    type="primary"
                                                    @click="addToCart(scope.row.Name)"
                                                    icon="el-icon-plus"
                                                    circle
                                                    plain>
                                            </el-button>
                                            <el-button
                                                    size="mini"
                                                    type="primary"
                                                    @click="delToCart(scope.row.Name)"
                                                    icon="el-icon-minus"
                                                    circle
                                                    plain>
                                            </el-button>
                                        </template>
                                    </el-table-column>
                                </el-table>
                            </template>
                        </el-table-column>
                        <el-table-column
                                label="菜单"
                                prop="Name">
                        </el-table-column>
                    </el-table>
                </el-col>
            </el-row>
            <el-row>
                <el-button type="success" size="medium" class="button-submit" @click="createOrder()">提交</el-button>
            </el-row>
        </div>
    </template>
    
    <script>
        export default {
            name: "order_add",
            data() {
                return {
                    order: {desk: null, cook: 0, pay: 0, comments: '', menus: []},
                    desk: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 100],
                    pay: [{value: 0, label: '未付款'}, {value: 1, label: '微信'}, {value: 2, label: '支付宝'}, {
                        value: 3,
                        label: '现金'
                    }],
                    cook: [{value: 0, label: '未做'}, {value: 1, label: '已做'}],
                    menus: null,
                }
            },
            created: function () {
                this.axios.get('/Data/MenuType/').then((response) => {
                    this.menus = response.data;
                })
            },
            methods: {
                addToCart(name) {
                    if (!this.onePlus(name))
                        this.order.menus.push({menu: {name: name, value: 1}})
                },
                delToCart(name) {
                    for (let i = 0, len = this.order.menus.length; i < len; i++) {
                        if (this.order.menus[i].menu.name === name) {
                            if (this.order.menus[i].menu.value > 1) {
                                this.order.menus[i].menu.value--
                            } else {
                                this.order.menus.splice(i, 1);
                            }
                        }
                    }
                },
                onePlus(name) {
                    for (let i = 0, len = this.order.menus.length; i < len; i++) {
                        if (this.order.menus[i].menu.name === name) {
                            this.order.menus[i].menu.value++
                            return true
                        }
                    }
                    return false;
                },
                createOrder() {
                    this.axios.post('/backoffice/create_order/', this.order)
                        .then(res => {
                            const h = this.$createElement;
    
                            this.$notify({
                                title: '创建订单成功！',
                                message: h('i', { style: 'color: teal'}, '')
                            });
                        }).catch(res => {
                        const h = this.$createElement;
    
                        this.$notify({
                            title: '创建订单失败！',
                            message: h('i', { style: 'color: teal'}, '请填写所有选项！')
                        });
                    })
                }
            }
        }
    </script>
    
    <style scoped>
        .fixed-cell {
            position: relative;
            height: 50px;
            top: 10px;
        }
    
        .menu-img {
            width: 30px;
            height: 30px;
        }
    
        .el-row {
            margin: 1%;
        }
    
        .button-submit {
            width: 200px;
            position: fixed;
            right: 1%;
        }
    </style>
    

##year.vue 年度统计页面
    <template>
        <div>
            <span>年份</span>
            <el-select @change="search()" v-model="year" placeholder="请选择年份" value="">
                <el-option
                        v-for="item in years"
                        :key="item"
                        :value="item">
                </el-option>
            </el-select>
            <h1>当年数据</h1>
            <ve-histogram :data="chartData"></ve-histogram>
            <ve-pie :data="circle_data"></ve-pie>
            <h4>总计： ￥{{circle_data.total}}</h4>
        </div>
    </template>
    
    <script>
        export default {
            name: "year",
            data: function () {
                return {
                    years: [2018, 2019],
                    year: 2019,
                    chartData: {
                        columns: ['month', 'value'],
                        rows: [],
                    },
                    circle_data: {
                        columns: ['name', 'value'],
                        rows: [],
                        total: 0
                    }
                }
            },
            created: function () {
                this.axios.get('/backoffice/revenue/year/' + this.year + '/0/0/').then((response) => {
                    this.chartData.rows = response.data.list;
                    this.circle_data.rows = response.data.circle;
                    this.circle_data.total = response.data.total;
                })
            },
            methods: {
                search() {
                    this.axios.get('/backoffice/revenue/year/' + this.year + '/0/0/').then((response) => {
                        this.chartData.rows = response.data.list;
                        this.circle_data.rows = response.data.circle;
                        this.circle_data.total = response.data.total;
                    })
                }
    
            }
        }
    </script>
    
    <style scoped>
        h4 {
            color: brown;
            text-align: right;
        }
    </style>

##month.vue 月度统计页面
    <template>
        <div>
            <span>年份</span>
            <el-select @change="search()" v-model="year" placeholder="请选择年份" value="">
                <el-option
                        v-for="item in years"
                        :key="item"
                        :value="item">
                </el-option>
            </el-select>
            <span>月份</span>
            <el-select @change="search()" v-model="month" placeholder="请选择月份" value="">
                <el-option
                        v-for="item in months"
                        :key="item"
                        :value="item">
                </el-option>
            </el-select>
            <h1>本月数据</h1>
            <ve-histogram :data="chartData"></ve-histogram>
            <ve-pie :data="circle_data"></ve-pie>
            <h4>总计： ￥{{circle_data.total}}</h4>
        </div>
    </template>
    
    <script>
        export default {
            name: "month",
            data: function () {
                return {
                    months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
                    years: [2018, 2019],
                    year: 2019,
                    month: 4,
                    chartData: {
                        columns: ['day', 'value'],
                        rows: [],
                    },
                    circle_data: {
                        columns: ['name', 'value'],
                        rows: [],
                        total: 0
                    }
                }
            },
            created: function () {
                this.axios.get('/backoffice/revenue/month/' + this.year + '/' + this.month + '/0/').then((response) => {
                    this.chartData.rows = response.data.list;
                    this.circle_data.rows = response.data.circle;
                    this.circle_data.total = response.data.total;
                })
            },
            methods: {
                search() {
                    this.axios.get('/backoffice/revenue/month/' + this.year + '/' + this.month + '/0/').then((response) => {
                        this.chartData.rows = response.data.list;
                        this.circle_data.rows = response.data.circle;
                        this.circle_data.total = response.data.total;
                    })
                }
    
            }
        }
    </script>
    
    <style scoped>
        h4 {
            color: brown;
            text-align: right;
        }
    </style>

##today.vue 今日统计页面
    <template>
        <div>
            <h1>今日数据</h1>
            <ve-pie :data="circle_data"></ve-pie>
            <h4>总计： ￥{{circle_data.total}}</h4>
        </div>
    </template>
    
    <script>
        export default {
            name: "revenue",
            data: function () {
                return {
                    circle_data: {
                        columns: ['name', 'value'],
                        rows: null,
                        total: 0
                    }
                }
            },
            created: function () {
                this.axios.get('/backoffice/revenue/today/0/0/0/').then((response) => {
                    this.circle_data.rows = response.data.circle;
                    this.circle_data.total = response.data.total;
                })
            },
        }
    </script>
    
    <style scoped>
        h1 {
            text-align: center;
        }
    
        h4 {
            color: brown;
            text-align: right;
        }
    </style>

