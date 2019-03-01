//app.js
App({
  onLaunch: function (options) {
    this.globalData.desk = parseInt(options.query.Desk)
    console.log("桌号:" + this.globalData.desk)
  },
  globalData: {
    // url: "http://10.129.104.16:8000",
    // ip:"10.129.104.16:8000",
    url: "http://192.168.199.200:8000",
    ip:"192.168.199.200:8000",
    userInfo: null,
    open_id: "guest",
    desk:100,
    order_id:'',
  }
})