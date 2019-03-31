//app.js
App({
  onLaunch: function (options) {
    this.globalData.desk = parseInt(options.query.Desk)
    console.log("桌号:" + this.globalData.desk)
  },
  globalData: {
    url: "http://127.0.0.1:8090",
    ip:"127.0.0.1:8090",
    // url:"https://www.qqmxd.com",
    // ip:"www.qqmxd.com",
    userInfo: null,
    open_id: "guest",
    desk:100,
    order_id:'',
  }
})