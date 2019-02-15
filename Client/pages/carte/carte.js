// pages/carte/carte.js
// var static_url = "https://www.qqmxd.com/"
var static_url = "http://127.0.0.1:8000/"
Page({

  /**
   * 页面的初始数据
   */
  data: {
    'MenuType': [],
    'now_type': '',
    'Menus': [],
    'cart': [],
    'activeMenuType': 0,
    'cart_switch': 0,
    'cart_list': []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this
    wx.request({
      url: static_url + 'Data/MenuType/',
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
      url: 'ws://127.0.0.1:8000/ws/Cart/1/',
    })
    wx.onSocketOpen(
      function(res) {
        console.log('WebSocket连接已打开！')
      }
    )
    wx.onSocketClose(
      function(res) {
        console.log('WebSocket连接已关闭！')
      }
    )
    var that=this
    wx.onSocketMessage(function(res) {
      var list = JSON.parse(JSON.parse(res.data).message)
      that.setData({
        cart_list:list
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
    var i = 0
    if (this.data.cart_switch == 0) {
      i = 1
    }
    this.setData({
      cart_switch: i
    })
  }
})