//app.js
App({
  onLaunch: function (options) {
    this.globalData.desk = parseInt(options.query.Desk)
    console.log("桌号:" + this.globalData.desk)
  },
  onShow(options) {
    this.globalData.desk = parseInt(options.query.Desk)
    console.log("桌号:" + this.globalData.desk)
  },
  globalData: {
    url: "http://120.77.45.136:8000",
    ip:"120.77.45.136:8000",
    // url:"https://www.qqmxd.com",
    // ip:"www.qqmxd.com",
    userInfo: null,
    open_id: "guest",
    desk:100,
    order_id:'',
  }
})