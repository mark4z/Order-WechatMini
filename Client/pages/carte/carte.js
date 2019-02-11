// pages/carte/carte.js
var static_url = "https://www.qqmxd.com/"
Page({

  /**
   * 页面的初始数据
   */
  data: {
    'MenuType': [],
    'Menus': [],
    'cart': [],
    'activeMenuType': 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function(options) {
    var that = this
    wx.request({
      url: static_url + 'mydata/MenuType',
      header: {
        'content-type': 'application/json' // 默认值
      },
      success(res) {
        that.setData({
          MenuType: res.data
        })
      }
    })
    wx.request({
      url: static_url + 'mydata/Menu',
      header: {
        'content-type': 'application/json' // 默认值
      },
      success(res) {
        that.setData({
          Menus: res.data
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
  select_type: function(e) {
    var index = e.currentTarget.dataset.index
    this.setData({
      activeMenuType: index,
    })
  },
})