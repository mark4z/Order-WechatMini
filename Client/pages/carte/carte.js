// pages/carte/carte.js
const app = getApp()
var static_url = app.globalData.url
Page({

  /**
   * 页面的初始数据
   */
  data: {
    'static_url': app.globalData.ip,
    'MenuType': [],
    'now_type': '',
    'Menus': [],
    'cart': [],
    'activeMenuType': 0,
    'cart_switch': 0,
    'cart_list': [],
    'list_price': 0,
    'list_num': 0,
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
  onReady: function() {
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function() {
    wx.connectSocket({
      url: 'ws://' + this.data.static_url + '/ws/Cart/' + app.globalData.desk+'/',
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
  Order:function(){
    wx.navigateTo({
      url: '/pages/confirm/confirm'
    })
  }
})