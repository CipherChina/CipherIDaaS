<template>
  <div>
    <AuthLogicBasic>
      <div class="main">
        <div class="accountVerify">
          <Tooltip content="密码登录" placement="left">
              <router-link to="/authLogic/login/staff"><img :src="qrUrl"/></router-link>
          </Tooltip>
      </div>
        <div class="scanCode">
          <!-- 钉钉扫码 -->
          <div class="dingdingConter">
            <div id="dingding"
                 :style="dingdingObj">
              <div style="color:#d0021b;"
                   v-if="dingdingErrorMsg">{{dingdingErrorMsg}}</div>
            </div>
          </div>
          <!-- 企业微信扫码 -->
          <div class="wxConter">
            <div id="wx_qrcode"
                 :style="wxObj">
              <div style="color:#d0021b;"
                   v-if="wxErrorMsg">{{wxErrorMsg}}</div>
            </div>
          </div>
          <!-- 其它扫码 -->
          <template v-if="scanCode">
            <template v-if="scanAppName!=='钉钉' && scanAppName!=='企业微信'">
              <img :src="qrcodeObj.qrcode"
                   alt="">
            </template>
          </template>
          <template v-else>
            <Form ref="formCustom"
                  :model="formCustom"
                  :rules="ruleCustom">
              <FormItem prop="accountNumber">
                <Input v-model="formCustom.accountNumber"
                       :placeholder="$t('common.account')"></Input>
              </FormItem>
              <FormItem prop="otp">
                <Input v-model="formCustom.otp"
                       placeholder="验证码"></Input>
                <ErrorSf :msg="msg"></ErrorSf>
              </FormItem>
              <div class="login">
                <ButtonSf @click="handleSubmit('formCustom')">{{$t('common.submit')}}</ButtonSf>
              </div>
            </Form>
          </template>
        </div>
        <div class="scanLogin scan">
          <div class="scanRefresh"
               v-if="scanAppName==='大白'&& scanCode">
            <span class="scanNotice">
              请使用<span>{{scanAppName}}</span>扫码二维码登录
            </span>
            <span class="refresh">
              <Icon type="ios-refresh" />
              <span @click="refresh">刷新</span>
            </span>
          </div>
          <p class="otherLoginText"
            v-if="logoItems.length!==0">
            <span class="text">{{$t('common.otherLogin')}}<Icon type="ios-arrow-down" /></span>
          </p>
          <template v-for="item in logoItems">
            <span v-if="item.show"
                  :key="item.index"
                  @mouseenter="mouseEnter(item.index)"
                  @mouseleave="mouseLeave"
                  :class="setClass(item)"
                  @click="clickLogo(item)">
            </span>
          </template>
        </div>
      </div>
    </AuthLogicBasic>
    <Loading v-if="loadingState" />
  </div>
</template>

<script>
import apiLogin from "@/api/authLogic/login.js";
import AuthLogicBasic from "@/components/authLogic/AuthLogicBasic.vue";
import verify from "@/util/verify.js";
import util from "@/views/authLogic/util/index.js";
import skipPathUtil from "@/views/authLogic/skipLogic.js";
import dingdingUtil from "@/views/authLogic/dingding.js";
import wxUtil from "@/views/authLogic/wx.js";
import TYPE from "@/views/authLogic/constantType/index.js";
import apiBinding from "@/api/authLogic/binding.js";
import Loading from "@/views/Loading.vue";
import { mapState, mapMutations } from "vuex";
export default {
  components: {
    AuthLogicBasic,
    Loading
  },
  data () {
    // 账号校验
    const validateAccount = (rule, value, callback) => {
      if (value.length === 0 || value.length > 50) {
        callback(new Error("请输入不超过50位账号"));
      }
      let regx = verify.loginAccount;
      if (!regx.test(value)) {
        callback(new Error("请输入字符（英文不区分大小写）"));
      }
      callback();
    };
    // 验证码校验
    const validateCode = (rule, value, callback) => {
      this.msg = "";
      let regx = verify.verifyCode;
      if (!regx.test(value)) {
        callback(new Error("请输入6位验证码"));
      }
      callback();
    };
    return {
      qrUrl: require("@/assets/img/qr-code.png"),
      loadingState: false,
      msg: "",
      scanWay: "", // 扫码方式
      dingdingRedirect: "false", // true钉钉扫码成功
      scanAppName: "", // 扫码方式
      // 钉钉
      dingdingObj: {},
      dingdingErrorMsg: "",
      // 企业微信
      appid: "",
      wxObj: {},
      wxErrorMsg: "",
      scanCode: true, // true扫码登录，false动态码登录
      // cipher
      cipherArray: [], // 选择的cipher认证方式
      styleObj: {}, // cipher认证方式标题
      cipherStyleObj: {}, // title样式
      isCipherActive: 1, // cipher验证选择，默认二维码验证
      // logo
      isActive: false, // logo滑动
      isSelActive: false, // logo点击
      qrcodeApiObj: { // api相关
        getApi: "", // 获取扫码api
        pollingApi: "" // 轮询扫码状态api
      },
      qrcodeObj: {
        qrcode: "", // 二维码的地址
        uuid: ""
      },
      interval: null, // 定时器
      formCustom: {
        accountNumber: "",
        otp: ""
      },
      ruleCustom: {
        accountNumber: [
          { validator: validateAccount, trigger: "blur" }
        ],
        totp: [
          { validator: validateCode, trigger: "blur" }
        ]
      },
      bindingApiObj: { // 绑定Api相关
        AutoApi: "", // 获取自动绑定api
        ManualApi: "", // 获取手动绑定api
        params: { // 请求参数
        }
      }
    };
  },
  mounted () {
    this.init();
  },
  computed: {
    logoItems () {
      return util.logoItems(this.authLogic.modes);
    },
    ...mapState({ authLogic: "authLogic" })
  },
  methods: {
    // 鼠标进入
    mouseEnter (index) {
      this.isActive = index;
    },
    // 鼠标离开
    mouseLeave () {
      this.isActive = null;
    },
    setClass (item) {
      return { logo: true, [item.logo]: true, active: item.index === this.isActive, selActiveScale: item.index === this.isSelActive };
    },
    /** 点击logo功能
     * 1.重新拉取二维码
     * 2.页面交互
     */
    clickLogo (item) {
      clearInterval(this.interval);
      this.isSelActive = item.index;
      this.scanWay = item.logo;
      this.getScanCodeApi(this.scanWay);
      // 设置显示扫码图标
      if (item.index === 1) { // 赛赋logo进来
        this.scanCode = false;
      } else { // 其他情况
        this.scanCode = true;
      }
      this.getScanAppName(this.scanWay);
    },
    init () {
      this.dingdingRedirect = this.$route.query.dingdingRedirect;
      let scanWay = this.$route.query.scanWay;
      this.scanWay = scanWay;
      let selLogoItem = this.logoItems.filter(function (ele, index, array) {
        return scanWay === ele.logo;
      });
      this.getScanAppName(scanWay);
      this.clickLogo(selLogoItem[0]); // 设置选择的logo

      if (this.dingdingRedirect) { // 钉钉跳转进来
        this.getDingdingScanCode();
      } else {
        this.getDingTalkId();
      }
      if (this.$route.query.wxRedirect) {
        this.getWxScanCode();
      } else {
        this.getWxId();
      }
    },
    // 获取扫码App的名字
    getScanAppName (scanWay) {
      switch (scanWay) {
        case TYPE.CIPHER:
          this.scanAppName = "赛赋";
          this.dingdingObj = { display: "none" };
          this.wxObj = { display: "none" };
          break;
        case TYPE.DABAI:
          this.scanAppName = "大白";
          this.dingdingObj = { display: "none" };
          this.wxObj = { display: "none" };
          break;
        case TYPE.DINGDING:
          this.scanAppName = "钉钉";
          this.dingdingObj = { display: "block" };
          this.wxObj = { display: "none" };
          break;
        case TYPE.WX:
          this.scanAppName = "企业微信";
          this.dingdingObj = { display: "none" };
          this.wxObj = { display: "block" };
          break;
        default:
          this.scanAppName = "其它";
          break;
      }
      return this.scanAppName;
    },
    // 下面要按顺序调用
    // 1.获取扫码api
    getScanCodeApi (scanWay) {
      switch (scanWay) {
        case TYPE.CIPHER:
          // this.qrcodeApiObj.getApi = apiLogin.saiFuQrcode;
          // this.qrcodeApiObj.pollingApi = apiLogin.saiFuPolling;
          // this.getScanCode();
          break;
        case TYPE.DABAI:
          this.qrcodeApiObj.getApi = apiLogin.daBaiQrcode;
          this.qrcodeApiObj.pollingApi = apiLogin.daBaiPolling;
          this.getScanCode();
          break;
        case TYPE.DINGDING: // dingding特有扫码接口
          // this.qrcodeApiObj.getApi = apiLogin.dingQrcode;
          // this.qrcodeApiObj.pollingApi = apiLogin.dingDingPolling;
          break;
        case TYPE.WX: // 企业微信特有扫码接口
          // this.qrcodeApiObj.getApi = apiLogin.wxQrcode;
          // this.qrcodeApiObj.pollingApi = apiLogin.wxPolling;
          break;
        default:
          this.qrcodeApiObj.getApi = "error";
          this.qrcodeApiObj.pollingApi = "error";
          break;
      }
    },
    // 2.获取需要扫码信息
    getScanCode () {
      this.axios({
        method: "post",
        data: {},
        url: this.qrcodeApiObj.getApi
      })
        .then(response => {
          if (response.data.return_code === 0
          ) {
            this.qrcodeObj.qrcode = response.data.qrcode;
            this.qrcodeObj.uuid = response.data.uuid;
            // 轮询获取扫码状态--todo
            this.interval = setInterval(() => {
              this.pollingGetScanState();
            }, 1000);
          } else {
            console.error(response);
          }
        })
        .catch(function (error) {
          this.axios.error.handlingErrors(error);
        });
    },
    // 3.轮询获取扫码状态
    pollingGetScanState () {
      let params = { uuid: this.qrcodeObj.uuid };
      this.axios({
        method: "post",
        data: params,
        url: this.qrcodeApiObj.pollingApi
      })
        .then(response => {
          let scanState = response.data.return_code;
          if (scanState === TYPE.SCAN.SUCCESS
          ) { // 1.扫码成功
            clearInterval(this.interval);
            this.scanLoginSkip(response);
          } else if (scanState === TYPE.SCAN.UNDERWAY
          ) { // 2.等待扫码
            // 轮询获取扫码状态
          } else { // 3.扫码失败
            clearInterval(this.interval);
            console.error(response);
          }
        })
        .catch(function (error) {
          this.axios.error.handlingErrors(error);
        });
    },
    // 钉钉扫码成功,获取钉钉扫码信息
    getDingdingScanCode () {
      let code = this.$route.query.code;
      // 防止dingding跳转时，userId保存失败
      this.authLogic.userInfo.userId = this.$route.query.userId;
      this.loadingState = true;
      setTimeout(function () {
        this.loadingState = false;
      }, 3000);
      this.changeAuthLogic(this.authLogic);
      let params = { code: code };
      this.axios({
        method: "post",
        data: params,
        url: apiLogin.dingTalkLogin
      })
        .then(response => {
          if (response.data.return_code === 0
          ) {
            this.scanLoginSkip(response);
          } else {
            this.dingdingErrorMsg = response.data.return_msg;
            console.error(response);
          }
        }).catch(function (error) {
          this.axios.error.handlingErrors(error);
        });
    },
    // 企业微信扫码成功,获取企业微信扫码信息
    getWxScanCode () {
      // 防止企业微信跳转时，userId保存失败
      this.authLogic.userInfo.userId = this.$route.query.userId;
      this.changeAuthLogic(this.authLogic);
      let code = this.$route.query.code;
      let params = { code: code };
      this.axios({
        method: "post",
        data: params,
        url: apiLogin.weixinPolling
      })
        .then(response => {
          if (response.data.return_code === 0
          ) {
            this.authLogic.userInfo.wxUserId = response.data.wxUserId;
            this.changeAuthLogic(this.authLogic);
            this.scanLoginSkip(response);
          } else {
            this.wxErrorMsg = response.data.return_msg;
            console.error(response);
          }
        }).catch(function (error) {
          this.axios.error.handlingErrors(error);
        });
    },
    // 刷新
    refresh () {
      this.getScanCode();
    },
    // 扫码登录跳转
    scanLoginSkip (response) {
      let data = response.data;
      let temp = {
        isBound: data.isBound,
        loginInfo: data.loginInfo,
        secondLoginInfo: data.secondLoginInfo,
        scanWay: this.scanWay
      };
      if (data.isBound === 0) { // 绑定时，把获取到的userId保存
        temp.userInfo = {};
        temp.userInfo.userId = data.loginInfo.userId;
      }
      // 根据三种扫码方式保存数据
      if (this.scanWay === TYPE.CIPHER) {
        temp.saiFuInfo = data.saiFuInfo;
      } else if (this.scanWay === TYPE.DABAI) {
        temp.daBaiInfo = data.daBaiInfo;
      } else if (this.scanWay === TYPE.WX) {
        temp.wxInfo = data.weixinInfo;
      } else {
        temp.dingTalkInfo = data.dingTalkInfo;
      }
      let authLogic = Object.assign({}, this.authLogic, temp);
      this.changeAuthLogic(authLogic);
      this.handleSkip(authLogic.isBound, authLogic.loginInfo, authLogic.secondLoginInfo);
    },
    // totp码登录提交=> otp码登录
    handleSubmit (name) {
      this.$refs[name].validate((valid) => {
        if (!valid) {
          return;
        }
        let params = {
          accountNumber: this.formCustom.accountNumber,
          otpDynamicCode: this.formCustom.otp
          // totp: this.formCustom.totp
        };
        this.axios({
          method: "post",
          data: params,
          url: apiLogin.pwdOtpLoginChecked
        })
          .then(response => {
            if (
              response.data.return_code === 0
            ) {
              this.otpLoginSkip(response);
            } else {
              let errorMsg = response.data.return_msg;
              this.msg = "账号或动态码错误";
              console.error(errorMsg);
            }
          })
          .catch(function (error) {
            this.axios.error.handlingErrors(error);
          });
      });
    },
    // otp码登录跳转
    otpLoginSkip (response) {
      let data = response.data;
      let temp = {
        loginInfo: data.loginInfo,
        secondLoginInfo: data.secondLoginInfo
      };
      temp.userInfo = {};
      temp.userInfo.userId = data.loginInfo.userId;
      // localStorage.setItem("authLogic", JSON.stringify(this.$store.state)); // 保存userId到localStorage
      let authLogic = Object.assign({}, this.authLogic, temp);
      this.changeAuthLogic(authLogic);
      let getSkipPath = skipPathUtil.getSkipPath(authLogic.loginInfo, authLogic.secondLoginInfo);
      this.$router.push(getSkipPath);
    },
    // 获取钉钉id
    getDingTalkId () {
      this.axios({
        method: "post",
        data: {},
        url: apiLogin.getDingTalkId
      })
        .then(response => {
          if (response.data.return_code === 0
          ) {
            let dingTalkData = response.data;
            this.authLogic.userInfo.dingTalkScanId = dingTalkData.dingTalkScanId;
            this.changeAuthLogic(this.authLogic);
            dingdingUtil.initGetDingding("/authLogic/login/scan", this.$store, dingTalkData);
          } else {
            console.error(response);
          }
        }).catch(function (error) {
          this.axios.error.handlingErrors(error);
        });
    },
    // 获取企业微信id和二维码
    getWxId () {
      this.axios({
        method: "post",
        data: {},
        url: apiLogin.getWxId
      })
        .then(response => {
          if (response.data.return_code === 0
          ) {
            let data = response.data;
            wxUtil.initGetWx("/authLogic/login/scan", this.$store, data);
          } else {
            console.error(response);
          }
        }).catch(function (error) {
          this.axios.error.handlingErrors(error);
        });
    },
    // 执行跳转逻辑
    handleSkip (isBound, loginInfo, secondLoginInfo) {
      let path = "";
      if (isBound) {
        // 没有绑定
        this.assembleGetInfo();
        this.getBindFlowInfo();
      } else {
        // 绑定
        path = skipPathUtil.getSkipPath(loginInfo, secondLoginInfo);
        path = path + "?scanWay=" + this.scanWay;
        this.$router.push(path);
      }
    },
    // 认证获取用户信息--------start
    // 组装api,参数
    assembleGetInfo () {
      switch (this.scanWay) {
        case TYPE.CIPHER:
          this.bindingApiObj.AutoApi = apiBinding.saiFuAutoMatch;
          this.bindingApiObj.params.saiFuId = this.authLogic.saiFuInfo.uuid;
          this.bindingApiObj.params.phoneNumber = this.authLogic.saiFuInfo.phoneNumber;
          this.bindingApiObj.params.mail = this.authLogic.saiFuInfo.mail;
          break;
        case TYPE.DABAI:
          this.bindingApiObj.AutoApi = apiBinding.daBaiAutoMatch;
          this.bindingApiObj.params.daBaiId = this.authLogic.daBaiInfo.id_num;
          break;
        case TYPE.DINGDING:
          this.bindingApiObj.AutoApi = apiBinding.dingTalkAutoMatch;
          this.bindingApiObj.params.unionId = this.authLogic.dingTalkInfo.unionId;
          this.bindingApiObj.params.phone = this.authLogic.dingTalkInfo.phone;
          this.bindingApiObj.params.mail = this.authLogic.dingTalkInfo.mail;
          break;
        case TYPE.WX:
          this.bindingApiObj.AutoApi = apiBinding.wxAutoMatch;
          this.bindingApiObj.params.wxUserId = this.authLogic.wxInfo.userid;
          this.bindingApiObj.params.phone = this.authLogic.wxInfo.mobile;
          this.bindingApiObj.params.mail = this.authLogic.wxInfo.email;
          break;
        default:
          console.error("scanWay:" + this.scanWay);
          break;
      }
    },
    // 1.获取绑定流程信息
    getBindFlowInfo () {
      this.axios({
        method: "post",
        data: {},
        url: apiBinding.bindingFlow
      })
        .then(response => {
          if (
            response.data.return_code === 0
          ) {
            let binDingFlow = response.data.binDingFlow;
            this.authLogic.binDingFlow = binDingFlow;
            this.changeAuthLogic(this.authLogic);
            this.dealBindingFlow(binDingFlow);
          } else {
            let errorMsg = response.data.return_msg;
            console.error(errorMsg);
          }
        })
        .catch(function (error) {
          this.axios.error.handlingErrors(error);
        });
    },
    // 2.处理绑定流程
    dealBindingFlow (binDingFlow) {
      let bindingFlowTemp = {};
      switch (this.scanWay) {
        case TYPE.CIPHER:
          bindingFlowTemp.bindingApp = binDingFlow.bindingAppSf; // 是否开启认证绑定
          bindingFlowTemp.autoBinding = binDingFlow.autoBindingSf; // 是否开启自动绑定
          break;
        case TYPE.DABAI:
          bindingFlowTemp.bindingApp = binDingFlow.bindingAppDb;
          bindingFlowTemp.autoBinding = binDingFlow.autoBindingDb;
          break;
        case TYPE.DINGDING:
          bindingFlowTemp.bindingApp = binDingFlow.bindingAppDd;
          bindingFlowTemp.autoBinding = binDingFlow.autoBindingDd;
          break;
        case TYPE.WX:
          bindingFlowTemp.bindingApp = binDingFlow.bindingAppWx;
          bindingFlowTemp.autoBinding = binDingFlow.autoBindingWx;
          break;
        default:
          console.error("scanWay:" + this.scanWay);
          break;
      }
      bindingFlowTemp.isOpenMailBind = binDingFlow.isOpenMailBind; // 开启邮箱校验
      bindingFlowTemp.isSkipMailBind = binDingFlow.isSkipMailBind; // 跳过邮箱校验
      bindingFlowTemp.isOpenNumBind = binDingFlow.isOpenNumBind; // 开启手机校验
      bindingFlowTemp.isSkipNumBind = binDingFlow.isSkipNumBind; // 跳过手机校验
      // 保存起来
      this.authLogic.binDingFlow = bindingFlowTemp;
      this.changeAuthLogic(this.authLogic);
      if (bindingFlowTemp.bindingApp === 0 && bindingFlowTemp.autoBinding === 0) { // 开启认证绑定和自动绑定才走自动匹配
        this.handleSubmitAuth(bindingFlowTemp);
      } else { // 不走自动绑定就到匹配失败页面
        this.$router.push("/authLogic/newUser/matchFail");
      }
    },
    // 3.授权获取信息--自动匹配
    handleSubmitAuth (binDingFlow) {
      this.axios({
        method: "post",
        data: this.bindingApiObj.params,
        url: this.bindingApiObj.AutoApi
      })
        .then(response => {
          let skipPath = "";
          if (
            response.data.return_code === 0
          ) { // 自动匹配成功
            // 更新用户id
            this.authLogic.userInfo.userId = response.data.userId;
            this.changeAuthLogic(this.authLogic);
            skipPath = skipPathUtil.bindSkipNextPage(binDingFlow, 1); // 跳到手机号验证或手机号验证下一步
          } else { // 自动匹配失败
            let errorMsg = response.data.return_msg;
            console.error(errorMsg);
            skipPath = "/authLogic/newUser/matchFail";
          }
          skipPath = skipPath + "?scanWay=" + this.scanWay;
          this.$router.push(skipPath);
        })
        .catch(function (error) {
          this.axios.error.handlingErrors(error);
        });
    },
    // 认证获取用户信息--------end
    ...mapMutations(["changeAuthLogic"])
  },
  beforeRouteLeave (to, from, next) {
    clearInterval(this.interval); // 定时器一定要清除
    next();
  }
};
</script>

<style lang="less" scoped>
@import "~@/assets/styles/authLogic/common.less";
.main {
  .authLogicOuther;
  .formsBody;
  .accountVerify{
    text-align: right;
    position: relative;
    top:10px;
    right: -20px;
    /deep/ .ivu-tooltip-arrow{
      width: 8px;
      height: 8px;
      transform: rotate(45deg);
      background: #DEEFFF;
      border:solid #99CEFF;
      border-width: 1px 1px 0 0;
      right: 5px;

    }
    /deep/ .ivu-tooltip-inner{
      background: #DEEFFF;
      color: #2196FF;
      border:1px solid #99CEFF;
      box-shadow:0 0 0 0;
      border-radius: 0;
    }
  }
  .scan {
    position: relative;
    .scanRefresh {
      font-size: 14px;
      color: #898d90;
      position: absolute;
      top: -60px;
      left: 0;
      right: 0;
      background-color: #fff;
      .refresh {
        color: #38adff;
        i {
          font-size: 20px;
        }
        &:hover {
          .mouseHover;
        }
      }
    }
  }
  .scanCode {
    height: 250px;
    margin-top: 50px;
    #dingding {
      position: relative;
      top: -45px;
    }
    img {
      width: 200px;
    }
    form {
      padding-top: 30px;
    }
  }
  .title {
    font-size: 18px;
    padding-top: 10px;
  }
  .dingdingTitle {
    font-size: 18px;
    margin-top: -26px;
  }
}
</style>
