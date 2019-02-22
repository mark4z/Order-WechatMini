// pages/confirm/confirm.js
const app = getApp()
var static_url = app.globalData.url
Page({

  /**
   * 页面的初始数据
   */
  data: {
    'static_url': app.globalData.ip,
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
        var total = 0
        for (var i = 0; i < res.data.detail.length; i++) {
          total += res.data.detail[i].price * res.data.detail[i].num
        };
        that.setData({
          cache_list: res.data,
          total: total,
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
        }
      })
    }
  }
})