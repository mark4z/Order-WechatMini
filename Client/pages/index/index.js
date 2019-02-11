//index.js
var static_url= "https://www.qqmxd.com/Static"
//获取应用实例
const app = getApp()
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
                    success: res => {
                      app.globalData.openId = res.data
                      console.log(app.globalData.openId)
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