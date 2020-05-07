import Vue from "vue";
import router from "./router/index.js";
import store from "./store/index";
import App from "./App.vue";
import axios from "./http";
// import axios from "axios";
import common from "@/util/common.js";
import qs from "qs";
import i18n from './lang'

import iView from "iview";
import "iview/dist/styles/iview.css";
import "./theme/index.less";
import { Loading } from "@/plugins/Loading.js";
import Toast from "@/plugins/Toast/index.js";
// import * as myPlugins from '@/plugins/Loading.js'
// Vue.use(myPlugins.Loading)
// import echarts from "echarts";
// Vue.prototype.$echarts = echarts;
import pluginSf from "@/components/authLogic/index.js";
Vue.use(pluginSf);

Vue.prototype.$qs = qs;
Vue.prototype.$common = common;
Vue.prototype.$toast = Toast;

Vue.config.productionTip = false;

Vue.prototype.axios = axios;

Vue.use(iView);
Vue.use(Loading);

// 在页面加载时读取localStorage里的状态信息
let authLogic = localStorage.getItem("authLogic");
let authLogicObj = "";
if (authLogic) {
  store.replaceState(Object.assign({}, store.state, JSON.parse(authLogic)));
}
let token = "";

// 在页面刷新时将vuex里的信息保存到localStorage里
window.addEventListener("beforeunload", () => {
  localStorage.setItem("authLogic", JSON.stringify(store.state));
});

router.beforeEach((to, from, next) => {
  // console.log("-------------------");
  // console.log("token before:" + token);
  // console.log(to);
  // console.log(from);
  authLogicObj = store.state.authLogic;
  if (authLogicObj) {
    if (authLogicObj.hasOwnProperty("userInfo")) {
      token = authLogicObj.userInfo.userId;
    } else {
      token = "";
    }
  }
  // console.log("token after:" + token);
  if (token === "") {
    // 没有登录
    if (to.path.includes("/authLogic/")) {
      // 没有登录时，只放行/authLogic路径下的路由
      next();
    } else {
      // 没有登录时，重定向到登陆页面
      next("/authLogic/login/staff/");
    }
  } else {
    // 已经登录
    if (to.path === "/") {
      // 已经登录时，重定向到应用列表页面
      next("/loginedShow");
    } else {
      // 已经登录时，放行所有路由
      next();
    }
  }
});

new Vue({
  router,
  store,
  axios,
  i18n,
  render: h => h(App)
}).$mount("#app");
