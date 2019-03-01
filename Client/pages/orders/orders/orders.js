// pages/orders/orders.js
const app = getApp()
var static_url = app.globalData.url
Page({

  /**
   * 页面的初始数据
   */
  data: {
    'list':null,
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    var that = this
    wx.request({
      url: static_url + "/Data/MyOrder/" + app.globalData.open_id + "/",
      header: {
        'content-type': 'application/json'
      },
      success(res) {
        console.log(res.data)
        for(var i=0;i<res.data.length;i++){
          var now = new Date(res.data[i].fields.Time).getTime
          res.data[i].fields.Time= now
        }
        that.setData({
          list: res.data
        })
      }
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
    detail: function(event){
    wx.navigateTo({
      url: '../detail/detail?id=' + event.currentTarget.id
    })
  }
})