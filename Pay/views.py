import json
import urllib
from django.http import HttpResponse
from django.shortcuts import render

# Create your views here.
from Data.models import User


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
    return HttpResponse(openid + " Access")
