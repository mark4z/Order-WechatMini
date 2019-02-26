// pages/pay/pay.js
const app = getApp()
var static_url = app.globalData.url
Page({

  /**
   * 页面的初始数据
   */
  data: {

  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {

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
  back:function(){
    wx.switchTab({
      url: '../index/index'
    })
  },
  pay:function(){
    var that=this
    wx.request({
      url: static_url + "/Pay/" + app.globalData.order_id + "/",
      method: 'GET',
      data: {
        'open_id': app.globalData.open_id
      },
      success: function (res) {
        console.log('支付参数：', res)
        wx.requestPayment({
          timeStamp: res.data.timeStamp,
          nonceStr: res.data.nonceStr,
          package: res.data.package,
          signType: res.data.signType,
          paySign: res.data.paySign,
          success: function (res) {
            console.log('支付成功：', res)
            wx.request({
              url: static_url + "/Pay/" + app.globalData.order_id + "/success/",
              method: 'GET',
              success(res) {
                console.log("PaySucc")
              }
            })
          },
          fail: function (res) {
            console.log('支付失败：', res)
          },
          complete: function (res) {
          },
        })
      }
    })
  }
})