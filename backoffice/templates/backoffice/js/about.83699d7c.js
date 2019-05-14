(window["webpackJsonp"]=window["webpackJsonp"]||[]).push([["about"],{1430:function(t,e,a){"use strict";a.r(e);var l=function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("div",[a("h1",[t._v("创建订单")]),a("el-row",{attrs:{gutter:20}},[a("el-col",{attrs:{span:12}},[a("span",[t._v("桌号：")]),a("el-select",{attrs:{placeholder:"请选择"},model:{value:t.order.desk,callback:function(e){t.$set(t.order,"desk",e)},expression:"order.desk"}},t._l(t.desk,function(t){return a("el-option",{key:t.value,attrs:{value:t}})}),1)],1),a("el-col",{attrs:{span:12}},[a("span",[t._v("付款状态：")]),a("el-select",{attrs:{placeholder:"请选择"},model:{value:t.order.pay,callback:function(e){t.$set(t.order,"pay",e)},expression:"order.pay"}},t._l(t.pay,function(t){return a("el-option",{key:t.value,attrs:{label:t.label,value:t.value}})}),1)],1)],1),a("el-row",{attrs:{gutter:20}},[a("el-col",{attrs:{span:12}},[a("span",[t._v("备注：")]),a("el-input",{staticStyle:{width:"80%"},attrs:{placeholder:"请输入备注"},model:{value:t.order.comments,callback:function(e){t.$set(t.order,"comments",e)},expression:"order.comments"}})],1),a("el-col",{attrs:{span:12}},[a("span",[t._v("后厨状态：")]),a("el-select",{attrs:{placeholder:"请选择"},model:{value:t.order.cook,callback:function(e){t.$set(t.order,"cook",e)},expression:"order.cook"}},t._l(t.cook,function(t){return a("el-option",{key:t.value,attrs:{label:t.label,value:t.value}})}),1)],1)],1),a("el-row",[a("el-col",{attrs:{span:12}},[a("el-table",{staticStyle:{width:"50%"},attrs:{data:t.order.menus,height:"400px"}},[a("el-table-column",{attrs:{prop:"menu",label:"菜品"},scopedSlots:t._u([{key:"default",fn:function(e){return[a("div",{staticClass:"fixed-cell"},[a("el-badge",{attrs:{value:e.row.menu.value}},[a("el-button",{attrs:{type:"success",plain:"",round:""}},[t._v(t._s(e.row.menu.name))])],1)],1)]}}])})],1)],1),a("el-col",{attrs:{span:12}},[a("el-table",{staticStyle:{width:"100%"},attrs:{data:t.menus,height:"400px"}},[a("el-table-column",{attrs:{type:"expand"},scopedSlots:t._u([{key:"default",fn:function(e){return[a("el-table",{attrs:{"show-header":!1,data:e.row.Menus}},[a("el-table-column",{attrs:{prop:"Img",label:"图片"},scopedSlots:t._u([{key:"default",fn:function(t){return[a("img",{staticClass:"menu-img",attrs:{src:"/Static/"+t.row.Img}})]}}],null,!0)}),a("el-table-column",{attrs:{prop:"Name",label:"菜品"}}),a("el-table-column",{attrs:{prop:"price",label:"单价"},scopedSlots:t._u([{key:"default",fn:function(e){return[a("span",{staticStyle:{color:"red"}},[t._v(" ￥ "+t._s(e.row.Price))])]}}],null,!0)}),a("el-table-column",{attrs:{label:"操作"},scopedSlots:t._u([{key:"default",fn:function(e){return[a("el-button",{attrs:{size:"mini",type:"primary",icon:"el-icon-plus",circle:"",plain:""},on:{click:function(a){return t.addToCart(e.row.Name)}}}),a("el-button",{attrs:{size:"mini",type:"primary",icon:"el-icon-minus",circle:"",plain:""},on:{click:function(a){return t.delToCart(e.row.Name)}}})]}}],null,!0)})],1)]}}])}),a("el-table-column",{attrs:{label:"菜单",prop:"Name"}})],1)],1)],1),a("el-row",[a("el-button",{staticClass:"button-submit",attrs:{type:"success",size:"medium"},on:{click:function(e){return t.createOrder()}}},[t._v("提交")])],1)],1)},r=[],n=(a("7f7f"),{name:"order_add",data:function(){return{order:{desk:null,cook:0,pay:0,comments:"",menus:[]},desk:[1,2,3,4,5,6,7,8,9,10,11,100],pay:[{value:0,label:"未付款"},{value:1,label:"微信"},{value:2,label:"支付宝"},{value:3,label:"现金"}],cook:[{value:0,label:"未做"},{value:1,label:"已做"}],menus:null}},created:function(){var t=this;this.axios.get("/Data/MenuType/").then(function(e){t.menus=e.data})},methods:{addToCart:function(t){this.onePlus(t)||this.order.menus.push({menu:{name:t,value:1}})},delToCart:function(t){for(var e=0,a=this.order.menus.length;e<a;e++)this.order.menus[e].menu.name===t&&(this.order.menus[e].menu.value>1?this.order.menus[e].menu.value--:this.order.menus.splice(e,1))},onePlus:function(t){for(var e=0,a=this.order.menus.length;e<a;e++)if(this.order.menus[e].menu.name===t)return this.order.menus[e].menu.value++,!0;return!1},createOrder:function(){var t=this;this.axios.post("/backoffice/create_order/",this.order).then(function(e){var a=t.$createElement;t.$notify({title:"创建订单成功！",message:a("i",{style:"color: teal"},"")})}).catch(function(e){var a=t.$createElement;t.$notify({title:"创建订单失败！",message:a("i",{style:"color: teal"},"请填写所有选项！")})})}}}),o=n,s=(a("841f"),a("2877")),c=Object(s["a"])(o,l,r,!1,null,"78ff74f8",null);e["default"]=c.exports},"1af3":function(t,e,a){"use strict";var l=a("3895"),r=a.n(l);r.a},"1c1c":function(t,e,a){"use strict";a.r(e);var l=function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("div",[a("span",[t._v("年份")]),a("el-select",{attrs:{placeholder:"请选择年份",value:""},on:{change:function(e){return t.search()}},model:{value:t.year,callback:function(e){t.year=e},expression:"year"}},t._l(t.years,function(t){return a("el-option",{key:t,attrs:{value:t}})}),1),a("h1",[t._v("当年数据")]),a("ve-histogram",{attrs:{data:t.chartData}}),a("ve-pie",{attrs:{data:t.circle_data}}),a("h4",[t._v("总计： ￥"+t._s(t.circle_data.total))])],1)},r=[],n={name:"year",data:function(){return{years:[2018,2019],year:2019,chartData:{columns:["month","value"],rows:[]},circle_data:{columns:["name","value"],rows:[],total:0}}},created:function(){var t=this;this.axios.get("/backoffice/revenue/year/"+this.year+"/0/0/").then(function(e){t.chartData.rows=e.data.list,t.circle_data.rows=e.data.circle,t.circle_data.total=e.data.total})},methods:{search:function(){var t=this;this.axios.get("/backoffice/revenue/year/"+this.year+"/0/0/").then(function(e){t.chartData.rows=e.data.list,t.circle_data.rows=e.data.circle,t.circle_data.total=e.data.total})}}},o=n,s=(a("1af3"),a("2877")),c=Object(s["a"])(o,l,r,!1,null,"b10d40fc",null);e["default"]=c.exports},"33ca":function(t,e,a){"use strict";a.r(e);var l=function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("div",[a("el-table",{staticStyle:{width:"100%"},attrs:{data:t.tableData}},[a("el-table-column",{attrs:{prop:"fields.Name",label:"昵称"}}),a("el-table-column",{attrs:{prop:"fields.Session",label:"Session"}}),a("el-table-column",{attrs:{prop:"fields.MRP",label:"积分"}})],1),a("el-pagination",{attrs:{background:"",layout:"prev, pager, next, jumper, ->, total, slot","page-size":10},on:{"current-change":t.CurrentChange}})],1)},r=[],n={name:"vip",data:function(){return{tableData:[]}},created:function(){var t=this;this.axios.get("/backoffice/Vip/1/").then(function(e){t.tableData=e.data})},methods:{CurrentChange:function(t){var e=this;this.axios.get("/backoffice/Vip/"+t).then(function(t){e.tableData=t.data})}}},o=n,s=a("2877"),c=Object(s["a"])(o,l,r,!1,null,"dc7c74e8",null);e["default"]=c.exports},3895:function(t,e,a){},"6de2":function(t,e,a){},7809:function(t,e,a){"use strict";a.r(e);var l=function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("div",[a("h1",[t._v("今日数据")]),a("ve-pie",{attrs:{data:t.circle_data}}),a("h4",[t._v("总计： ￥"+t._s(t.circle_data.total))])],1)},r=[],n={name:"revenue",data:function(){return{circle_data:{columns:["name","value"],rows:null,total:0}}},created:function(){var t=this;this.axios.get("/backoffice/revenue/today/0/0/0/").then(function(e){t.circle_data.rows=e.data.circle,t.circle_data.total=e.data.total})}},o=n,s=(a("c543"),a("2877")),c=Object(s["a"])(o,l,r,!1,null,"79c1c11b",null);e["default"]=c.exports},7892:function(t,e,a){},"7f7f":function(t,e,a){var l=a("86cc").f,r=Function.prototype,n=/^\s*function ([^ (]*)/,o="name";o in r||a("9e1e")&&l(r,o,{configurable:!0,get:function(){try{return(""+this).match(n)[1]}catch(t){return""}}})},"841f":function(t,e,a){"use strict";var l=a("7892"),r=a.n(l);r.a},a190:function(t,e,a){},ab55:function(t,e,a){"use strict";var l=a("6de2"),r=a.n(l);r.a},b50a:function(t,e,a){"use strict";var l=a("a190"),r=a.n(l);r.a},c543:function(t,e,a){"use strict";var l=a("ca5b"),r=a.n(l);r.a},c6d9:function(t,e,a){"use strict";a.r(e);var l=function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("div",[a("span",[t._v("年份")]),a("el-select",{attrs:{placeholder:"请选择年份",value:""},on:{change:function(e){return t.search()}},model:{value:t.year,callback:function(e){t.year=e},expression:"year"}},t._l(t.years,function(t){return a("el-option",{key:t,attrs:{value:t}})}),1),a("span",[t._v("月份")]),a("el-select",{attrs:{placeholder:"请选择月份",value:""},on:{change:function(e){return t.search()}},model:{value:t.month,callback:function(e){t.month=e},expression:"month"}},t._l(t.months,function(t){return a("el-option",{key:t,attrs:{value:t}})}),1),a("h1",[t._v("本月数据")]),a("ve-histogram",{attrs:{data:t.chartData}}),a("ve-pie",{attrs:{data:t.circle_data}}),a("h4",[t._v("总计： ￥"+t._s(t.circle_data.total))])],1)},r=[],n={name:"month",data:function(){return{months:[1,2,3,4,5,6,7,8,9,10,11,12],years:[2018,2019],year:2019,month:4,chartData:{columns:["day","value"],rows:[]},circle_data:{columns:["name","value"],rows:[],total:0}}},created:function(){var t=this;this.axios.get("/backoffice/revenue/month/"+this.year+"/"+this.month+"/0/").then(function(e){t.chartData.rows=e.data.list,t.circle_data.rows=e.data.circle,t.circle_data.total=e.data.total})},methods:{search:function(){var t=this;this.axios.get("/backoffice/revenue/month/"+this.year+"/"+this.month+"/0/").then(function(e){t.chartData.rows=e.data.list,t.circle_data.rows=e.data.circle,t.circle_data.total=e.data.total})}}},o=n,s=(a("ab55"),a("2877")),c=Object(s["a"])(o,l,r,!1,null,"153734b6",null);e["default"]=c.exports},ca5b:function(t,e,a){},ef3d:function(t,e,a){"use strict";a.r(e);var l=function(){var t=this,e=t.$createElement,a=t._self._c||e;return a("div",[a("el-table",{attrs:{data:t.tableData,"max-height":"560","row-class-name":t.tableRowClassName}},[a("el-table-column",{attrs:{type:"expand"},scopedSlots:t._u([{key:"default",fn:function(e){return[a("el-form",{staticClass:"demo-table-expand",attrs:{"label-position":"left",inline:""}},[a("el-form-item",{attrs:{label:"后厨状态"}},[a("span",[t._v(t._s(e.row.cook_status))])]),a("el-form-item",{attrs:{label:"备注"}},[a("span",[t._v(t._s(e.row.comments))])]),a("el-form-item",{attrs:{label:"菜单列表"}},[a("el-table",{staticStyle:{width:"95%"},attrs:{data:e.row.menus}},[a("el-table-column",{attrs:{prop:"name",label:"图片"},scopedSlots:t._u([{key:"default",fn:function(t){return[a("img",{staticClass:"menu-img",attrs:{src:"/Static/"+t.row.img}})]}}],null,!0)}),a("el-table-column",{attrs:{prop:"name",label:"菜品"}}),a("el-table-column",{attrs:{prop:"num",label:"数量"}}),a("el-table-column",{attrs:{prop:"price",label:"价格"},scopedSlots:t._u([{key:"default",fn:function(e){return[a("span",{staticStyle:{color:"red"}},[t._v(" ￥ "+t._s(e.row.price*e.row.num))])]}}],null,!0)})],1)],1)],1)]}}])}),a("el-table-column",{attrs:{prop:"id",label:"订单号"}}),a("el-table-column",{attrs:{prop:"user",label:"用户"}}),a("el-table-column",{attrs:{prop:"time",label:"时间",sortable:""}}),a("el-table-column",{attrs:{prop:"desk",label:"桌号",width:"60px"}}),a("el-table-column",{attrs:{prop:"total",label:"总金额",width:"100px"},scopedSlots:t._u([{key:"default",fn:function(e){return[a("p",{staticStyle:{color:"red"}},[t._v("￥ "+t._s(e.row.total))])]}}])}),a("el-table-column",{attrs:{prop:"order_status",label:"付款方式",width:"120px"}})],1),a("el-pagination",{attrs:{background:"",layout:"prev, pager, next, jumper, ->, total, slot",total:t.total,"page-size":10},on:{"current-change":t.CurrentChange}})],1)},r=[],n={name:"order_list",data:function(){return{tableData:[],total:0}},created:function(){var t=this;this.axios.get("/backoffice/order_list/1").then(function(e){t.tableData=e.data.detail,t.total=e.data.total})},methods:{CurrentChange:function(t){var e=this;this.axios.get("/backoffice/order_list/"+t).then(function(t){e.tableData=t.data.detail})},tableRowClassName:function(t){var e=t.row;return"未付款"==e.order_status?"warning-row":"success-row"},handleEdit:function(t){this.$router.push("/order_edit/"+t)}}},o=n,s=(a("b50a"),a("2877")),c=Object(s["a"])(o,l,r,!1,null,null,null);e["default"]=c.exports}}]);
//# sourceMappingURL=about.83699d7c.js.map