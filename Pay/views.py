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
