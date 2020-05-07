<template>
  <div>
    <AuthLogicBasic>
      <div class="main">
        <p class="title titleLevel1">{{$t('common.title')}}</p>
        <div class="content">
          <!-- 钉钉、企业微信报错 -->
          <div v-if="errorObj.dingNotice &&  (activeName==='dingDing' || activeName==='wx')"
               class="error">
            认证失败请重试
          </div>
          <!-- 钉钉扫码 -->
          <div v-if="activeName==='dingDing'">
            <div id="dingding"></div>
          </div>
          <!-- 企业微信扫码 -->
          <div v-if="activeName==='wx'"
               class="wx">
            <div id="wx_qrcode"></div>
          </div>
          <!-- 动态码 -->
          <Form ref="formDt"
                v-if="activeName==='dtCode'"
                :model="formDt"
                :rules="ruleDt"
                class="code">
            <FormItem prop="code">
              <Tooltip content="请打开赛赋TOTP小程序查看动态密码"
                       placement="right"
                       v-if="!canBindOtp">
                <Input v-model="formDt.code"
                       placeholder="输入动态密码"></Input>
              </Tooltip>
              <Input v-model="formDt.code"
                     v-else
                     placeholder="输入动态密码"></Input>
              <div v-if="canBindOtp"
                   class="can-bind-otp"
                   @click="getOtpQrcode">获取动态密码</div>
              <div v-if="errorDtMsg"
                   class="content-item-error">
                {{errorDtMsg}}
              </div>
            </FormItem>
            <div class="login">
              <ButtonSf @click="handleSubmitDt('formDt')">登录</ButtonSf>

            </div>
          </Form>
          <!-- 手机验证码 -->
          <Form ref="formPhone"
                v-if="activeName==='phoneCode'"
                :model="formPhone"
                :rules="rulePhone">
            <FormItem prop="phoneNumber"
                      class="phone">
              <Input v-model="formPhone.phoneNumber"
                     readonly></Input>
            </FormItem>
            <div class="code">
              <div>
                <FormItem prop="code"
                          :class="{'hiddenError':isHiddenError}">
                  <Input v-model="formPhone.code"
                         placeholder="输入验证码"></Input>
                  <ErrorSf :msg="errorPhoneMsg"></ErrorSf>
                </FormItem>
              </div>
              <div class="getCode">
                <ButtonCode @click="getCode('formPhone')"
                            ref="timerbtn"></ButtonCode>
              </div>
            </div>
            <div class="login">
              <ButtonSf @click="handleSubmitPhone('formPhone')">登录</ButtonSf>
            </div>
          </Form>
          <!-- 钉钉Push -->
          <div id="dingpush"
               v-if="activeName==='dingPush'">
            {{pushTip}}
            <span v-if="pushState===1">,请点击<span @click="tryAgain"
                    class="dingpush-try"> 重试 </span></span>
            <div v-if="pushState===2">请点击<span @click="tryAgain"
                    class="dingpush-try"> 重试 </span>再次认证</div>
          </div>
        </div>
        <div class="footer">
          <div class="footer-choose clearfix"
               :style="moveMargin">
            <div class="footer-choose-item"
                 v-for="item in logoList"
                 :key="item.name"
                 :class="{'footer-choose-item-active':activeName===item.name}"
                 @click="changeAuthType(item)">
              <div class="footer-img">
                <div class="footer-active-bg"></div><img :src="item.logo" />
              </div>
              <span>{{item.text}}</span>
            </div>
          </div>
          <template v-if="showArrow">
            <Icon type="ios-arrow-back"
                  class="footer-arrow footer-arrow-back"
                  :class="[isShowLeft?'show':'hidden']"
                  @click="moveDirection('left')" />
            <Icon type="ios-arrow-forward"
                  class="footer-arrow footer-arrow-forward"
                  :class="[isShowRight?'show':'hidden']"
                  @click="moveDirection('right')" />
          </template>
        </div>
        <div class="modal otp-qr-code-modal"
             v-if="isShowQRCode">
          <Icon type="md-close"
                @click="isShowQRCode=false"
                class="modal-close" />
          <div class="otp-qr-code">
            <div style="margin-bottom:8px">打开微信扫一扫，获取动态码</div>
            <img :src="otpQrCode">
          </div>
        </div>
      </div>
    </AuthLogicBasic>
  </div>
</template>

<script>
import skipPathUtil from "@/views/authLogic/skipLogic.js";
import apiLogin from "@/api/authLogic/login.js";
import api from "@/api/authLogic/index.js";
import AuthLogicBasic from "@/components/authLogic/AuthLogicBasic.vue";
import dingdingUtil from "@/views/authLogic/dingding.js";
import wxUtil from "@/views/authLogic/wx.js";
import verify from "@/util/verify.js";
import { mapState, mapMutations } from "vuex";
export default {
  components: {
    AuthLogicBasic
  },
  data () {
    // 验证码校验
    const validateCode = (rule, value, callback) => {
      this.errorDtMsg = "";
      this.errorPhoneMsg = "";
      let regx = verify.verifyCode;
      if (!regx.test(value)) {
        callback(new Error("请输入6位验证码"));
      }
      callback();
    };
    // 手机号校验
    const validatePhoneNumber = (rule, value, callback) => {
      this.errorPhoneMsg = "";
      let regx = verify.phoneNumber;
      if (!regx.test(value)) {
        callback(new Error("请输入正确的手机号"));
      }
      callback();
    };
    return {
      activeName: "", // 选择的二次认证方式名称
      moveMarginDistance: 0,
      isShowLeft: false,
      isShowRight: true,
      errorObj: { dingError: false, wxError: false },
      dingTalkData: "", // 钉钉信息
      // 钉钉push
      isFirstPush: true, // 是否首次切换push
      pushTip: "",
      pushState: 0, // push状态 0-push中，认证成功 1-认证超时 2-认证失败
      // 动态码
      isShowQRCode: false, // 是否显示获取otp码的二维码
      otpQrCode: "", // otp二维码
      errorDtMsg: "", // 动态码错误信息
      formDt: {
        code: ""
      },
      ruleDt: {
        code: [{ validator: validateCode, trigger: "blur" }]
      },
      // 手机验证码
      isHiddenError: false, // 验证码input验证自带信息是否显示
      errorPhoneMsg: "", // 手机验证码错误信息
      formPhone: {
        phoneNumber: "",
        code: ""
      },
      rulePhone: {
        phoneNumber: [
          { validator: validatePhoneNumber, trigger: "blur" }
        ],
        code: [
          { validator: validateCode, trigger: "blur" }
        ]
      }
    };
  },
  computed: {
    ...mapState({ authLogic: "authLogic" }),
    logoList () {
      let logoArray = [];
      let secondLoginInfo = this.authLogic.secondLoginInfo;
      if (secondLoginInfo.twoAuthDd === 0) {
        logoArray.push({ name: "dingDing", logo: require("@/assets/img/two-auth-dingDing.png"), text:this.$t('otherWay.dingTalk')});
      }
      if (secondLoginInfo.twoAuthDt === 0) {
        logoArray.push({ name: "dtCode", logo: require("@/assets/img/two-auth-dtCode.png"), text: this.$t('otherWay.OPT') });
      }
      if (secondLoginInfo.twoAuthNum === 0) {
        logoArray.push({ name: "phoneCode", logo: require("@/assets/img/two-auth-phoneCode.png"), text: this.$t('otherWay.SMS') });
      }
      if (secondLoginInfo.twoAuthDingPush === 0) {
        logoArray.push({ name: "dingPush", logo: require("@/assets/img/two-auth-dingPush.png"), text: "DingPush" });
      }
      if (secondLoginInfo.twoAuthWx === 0) {
        logoArray.push({ name: "wx", logo: require("@/assets/img/two-auth-wx.png"), text: this.$t('otherWay.weChat') });
      }
      return logoArray;
    },
    canBindOtp () {
      return this.authLogic.secondLoginInfo.otpBindKey === 0;
    },
    moveMargin () {
      if (this.logoList.length === 1) {
        return { marginLeft: "129px" };
      }
      if (this.logoList.length === 2) {
        return { marginLeft: "86px" };
      }
      if (this.logoList.length === 3) {
        return { marginLeft: "43px" };
      }
      return { marginLeft: this.moveMarginDistance };
    },
    showArrow () {
      return this.logoList.length > 4;
    }
  },
  mounted () {
    this.activeName = this.logoList[0].name; // 活跃的logo名称
    this.authLogic.secondLoginInfo.twoAuthDd === 0 && this.getDingding(); // 获取钉钉扫码id及二维码
    this.authLogic.secondLoginInfo.twoAuthWx === 0 && this.getWx(); // 获取钉钉扫码id及二维码
    this.authLogic.secondLoginInfo.twoAuthNum === 0 && this.getContactInfo(); // 获取手机号
    this.activeName === "dingPush" && this.handleSubmitDingPush(); // 如果当前活跃的是钉钉Push，执行push请求
  },
  methods: {
    /**
     * 改变认证方式时触发
     * @param {*Object 包含认证name，logo，text} item
     * @author yezi 2019-09-03
     */
    changeAuthType (item) {
      this.activeName = item.name;
      if (item.name === "dingDing") {
        this.getDingding();
      }
      if (item.name === "wx") {
        this.getWx();
      }
      if (this.isFirstPush && item.name === "dingPush") { // 首次点击push，钉钉push,发送钉钉push请求
        this.handleSubmitDingPush();
      }
    },
    /**
     * 点击左右箭头移动
     * @param {*Strin 方向} direction
     * @author yezi 2019-10-14
     */
    moveDirection (direction) {
      if (direction === "right") {
        this.moveMarginDistance = "-86px";
        this.isShowLeft = true;
        this.isShowRight = false;
      } else {
        this.moveMarginDistance = 0;
        this.isShowLeft = false;
        this.isShowRight = true;
      }
    },
    /**
     * 钉钉扫码，根据是否有回调地址，判断展示二维码还是进行认证
     * @param {*void}
     * @author yezi 2019-09-04
     */
    getDingding () {
      this.dingdingRedirect = this.$route.query.dingdingRedirect;
      if (this.dingdingRedirect) {
        this.activeName = "dingding";
        this.getDingdingScanCode();
      } else {
        this.getDingTalkId();
      }
    },
    /**
    * 获取钉钉id
    * @param {*void}
    * @author yezi 2019-09-03
    */
    getDingTalkId () {
      this.axios({
        method: "post",
        data: {},
        url: apiLogin.getDingTalkId
      })
        .then(response => {
          if (response.data.return_code === 0
          ) {
            this.dingTalkData = response.data;
            this.authLogic.userInfo.dingTalkScanId = this.dingTalkData.dingTalkScanId;
            this.changeAuthLogic(this.authLogic);
            dingdingUtil.initGetDingding("/authLogic/login/scan", this.$store, this.dingTalkData);
          } else {
            console.error(response);
          }
        }).catch(function (error) {
          this.axios.error.handlingErrors(error);
        });
    },
    /**
     * 钉钉扫码成功,获取钉钉扫码信息
     * @param {*void}
     * @author yezi 2019-09-04
     */
    getDingdingScanCode () {
      let code = this.$route.query.code;
      // 防止dingding跳转时，userId保存失败
      this.authLogic.userInfo.userId = this.$route.query.userId;
      this.changeAuthLogic(this.authLogic);
      let params = { code: code };
      this.axios({
        method: "post",
        data: params,
        url: apiLogin.dingTalkSecondAuth
      })
        .then(response => {
          if (response.data.return_code === 0
          ) {
            let skipPath = skipPathUtil.skipSecondAuthPath(this.authLogic.loginInfo, this.authLogic.secondLoginInfo, true);
            this.$router.push({ path: skipPath });
          } else {
            console.error(response);
            this.errorObj.dingError = true;
          }
        }).catch(function (error) {
          this.axios.error.handlingErrors(error);
        });
    },
    /**
    * 企业微信扫码，根据是否有appid，判断展示二维码还是进行认证
    * @param {*void}
    * @author yezi 2019-09-04
    */
    getWx () {
      if (this.$route.query.wxRedirect) {
        this.activeName = "wx";
        this.getWxScanCode();
      } else {
        this.getWxId();
      }
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
            wxUtil.initGetWx("/authLogic/oldUser/twoAuth", this.$store, data);
          } else {
            console.error(response);
          }
        }).catch(function (error) {
          this.axios.error.handlingErrors(error);
        });
    },
    // 企业微信扫码成功,获取企业微信扫码信息
    getWxScanCode () {
      let code = this.$route.query.code;
      // 防止企业微信跳转时，userId保存失败
      this.authLogic.userInfo.userId = this.$route.query.userId;
      this.changeAuthLogic(this.authLogic);
      let params = { code: code };
      this.axios({
        method: "post",
        data: params,
        url: apiLogin.weixinSecondAuth
      })
        .then(response => {
          if (response.data.return_code === 0) {
            let skipPath = skipPathUtil.skipSecondAuthPath(this.authLogic.loginInfo, this.authLogic.secondLoginInfo, true);
            this.$router.push({ path: skipPath });
          } else {
            console.error(response);
            this.errorObj.wxError = true;
          }
        }).catch(function (error) {
          this.axios.error.handlingErrors(error);
        });
    },
    /**
     * 获取手机号
     * @param {*void}
     * @author yezi 2019-09-04
     */
    getContactInfo () {
      this.axios({
        method: "post",
        data: {},
        url: api.getContactInfo
      })
        .then(response => {
          if (
            response.data.return_code === 0
          ) {
            let data = response.data;
            if (data.isPhoneCollect === 0) {
              this.formPhone.phoneNumber = data.phoneNumber;
            }
          } else {
            let errorMsg = response.data.return_msg;
            this.errorPhoneMsg = errorMsg;
            console.error(errorMsg);
          }
        })
        .catch(function (error) {
          this.axios.error.handlingErrors(error);
        });
    },
    /**
     * 获取验证码
     */
    getCode (name) {
      this.isHiddenError = true;
      let regx = verify.phoneNumber;
      if (!regx.test(this.formPhone.phoneNumber)) {
        this.errorPhoneMsg = "您未绑定手机号或绑定的手机号码不正确";
        return;
      }
      this.errorPhoneMsg = "";
      this.$refs.timerbtn.setDisabled(true);

      let params = {
        phoneNumber: this.formPhone.phoneNumber
      };
      this.axios({
        method: "post",
        data: params,
        url: api.sendPhoneCode
      })
        .then(response => {
          if (
            response.data.return_code !== 0
          ) {
            this.$refs.timerbtn.stop(); // 停止倒计时
            let errorMsg = response.data.return_msg;
            this.errorPhoneMsg = errorMsg;
            console.error(errorMsg);
          } else {
            this.$refs.timerbtn.start(); // 启动倒计时
          }
        })
        .catch(function (error) {
          this.$refs.timerbtn.stop(); // 停止倒计时
          this.axios.error.handlingErrors(error);
        });
    },
    /**
     * 获取otp的qrcode
     * @param {*void}
     * @author yezi 2019-09-25
     */
    getOtpQrcode () {
      this.isShowQRCode = true;
      this.axios({
        method: "post",
        data: {},
        url: apiLogin.otpQrcode
      })
        .then(response => {
          if (response.data.return_code === 0
          ) {
            this.otpQrCode = response.data.qrcode;
          } else {
            let errorMsg = response.data.return_msg;
            this.errorDtMsg = errorMsg;
            console.error(errorMsg);
          }
        })
        .catch(function (error) {
          this.axios.error.handlingErrors(error);
        });
    },
    /**
     * 提交动态码
     * @param {*String form表单名字} name
     * @author yezi 2019-09-04
     */
    handleSubmitDt (name) {
      this.$refs[name].validate((valid) => {
        if (!valid) {
          return;
        }
        let params = { otpDynamicCode: this.formDt.code };
        this.axios({
          method: "post",
          data: params,
          url: apiLogin.otpSecondCheck
        })
          .then(response => {
            if (response.data.return_code === 0
            ) {
              let skipPath = skipPathUtil.skipSecondAuthPath(this.authLogic.loginInfo, this.authLogic.secondLoginInfo, true);
              this.$router.push({ path: skipPath });
            } else {
              let errorMsg = response.data.return_msg;
              this.errorDtMsg = errorMsg;
              console.error(errorMsg);
            }
          })
          .catch(function (error) {
            this.axios.error.handlingErrors(error);
          });
      });
    },
    /**
     * 提交手机验证码
     * @param {*String form表单名字} name
     * @author yezi 2019-09-04
     */
    handleSubmitPhone (name) {
      this.$refs[name].validate((valid) => {
        if (!valid) {
          return;
        }
        let params = {
          phoneNumber: this.formPhone.phoneNumber,
          code: this.formPhone.code
        };
        this.axios({
          method: "post",
          data: params,
          url: apiLogin.phoneCodeSecondChecked
        })
          .then(response => {
            if (
              response.data.return_code === 0
            ) {
              let skipPath = skipPathUtil.skipSecondAuthPath(this.authLogic.loginInfo, this.authLogic.secondLoginInfo, true);
              this.$router.push({ path: skipPath });
            } else {
              let errorMsg = response.data.return_msg;
              this.errorPhoneMsg = errorMsg;
              console.error(errorMsg);
            }
          })
          .catch(function (error) {
            this.axios.error.handlingErrors(error);
          });
      });
    },
    /**
     * 点击重试按钮调用，重新执行push请求
     * @param {*void}
     * @author yezi 2019-08-12
     */
    tryAgain () {
      this.handleSubmitDingPush();
    },
    /**
      * push请求，成功进入下一步，请求超时后台返回code 140
      * @param {*void}
      * @author yezi 2019-08-12
      */
    handleSubmitDingPush () {
      this.isFirstPush = false; // 将首次push设置为false
      this.pushTip = "请打开钉钉进行确认"; // 将提示 设置成等待确认
      this.pushState = 0;
      // push认证接口
      this.axios({
        method: "post",
        data: {},
        url: apiLogin.dingPushSecondCheck
      })
        .then(response => {
          if (response.data.return_code === 0) {
            this.pushTip = "认证成功，挑转中…";
            if (this.$route.path === "/authLogic/oldUser/twoAuth") {
              let skipPath = skipPathUtil.skipSecondAuthPath(this.authLogic.loginInfo, this.authLogic.secondLoginInfo, true);
              this.$router.push({ path: skipPath });
            }
          } else if (response.data.return_code === 140) { // 登陆超时
            this.pushState = 1;
            this.pushTip = "等待超时";
          } else { // 其他认证错误
            this.pushState = 2;
            this.pushTip = "认证失败";
          }
        })
        .catch(function (error) {
          this.axios.error.handlingErrors(error);
        });
    },
    ...mapMutations(["changeAuthLogic"])
  }
};

</script>

<style lang="less" scoped>
@import "~@/assets/styles/authLogic/common.less";
.main {
  .authLogicOuther;
  .formsBody;
  .title {
    padding: 28px 0 0 0;
    position: relative;
    z-index: 1;
  }
  .content {
    height: 280px;
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    .content-item-error {
      position: absolute;
      left: 0;
      top: 38px;
      color: #ed4014;
    }
    #dingding {
      position: relative;
      top: -10px;
    }
    #dingpush {
      color: #a7a7a7;
      font-size: 14px;
      .dingpush-try {
        color: #0091ff;
        font-size: @fontSize16;
        font-weight: 500;
      }
    }
  }
  .footer {
    margin: 0 -24px 24px;
    width: 364px;
    overflow: hidden;
    position: relative;
    .footer-choose {
      width: 450px;
      transition: all 0.3s;
      .footer-choose-item {
        width: 70px;
        float: left;
        text-align: center;
        margin: 0 10px;
        .footer-img {
          position: relative;
          width: 56px;
          height: 80px;
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 0 8px;
          border-radius: 4px;
          border: 1px solid rgba(167, 167, 167, 1);
        }
        span {
          line-height: 20px;
          color: #6d7278;
          font-size: @fontSize14;
        }
        &:hover {
          .footer-img {
            border: 2px solid rgba(0, 145, 255, 1);
          }
          span {
            color: #0091ff;
          }
        }
      }
    }
  }
  .footer-choose-item-active {
    .footer-active-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(167, 167, 167, 0.5);
      border: 1px solid rgba(167, 167, 167, 1) !important;
    }
    span {
      color: #08142c !important;
    }
  }
}
form {
  width: 100%;
  .code{
    position: relative;
    margin-bottom: 50px;
  }
}
.hiddenError /deep/ .ivu-form-item-error-tip {
  display: none;
}
.hidden {
  visibility: hidden;
}
.phone /deep/ input {
  border-color: #cecece;
  color: #cecece;
  box-shadow: none;
}
/deep/ .ivu-tooltip {
  width: 100%;
}
.can-bind-otp {
  .can-bind-otp-style;
}
.modal {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 2;
  .modal-close {
    font-size: 24px;
    color: #fff;
    position: absolute;
    right: 16px;
    top: 16px;
    cursor: pointer;
  }
  .otp-qr-code {
    margin-top: 130px;
    font-size: 14px;
    img {
      width: 200px;
    }
  }
}
.footer-arrow {
  position: absolute;
  top: 50px;
  transform: translateY(-50%);
  font-size: 30px;
  transition: all 0.3s;
  &:hover {
    color: @colorBase4;
  }
}
.footer-arrow-back {
  left: -8px;
}
.footer-arrow-forward {
  right: -8px;
}
.show {
  visibility: visible;
  opacity: 1;
}
.hidden {
  visibility: hidden;
  opacity: 0;
}
.wx {
  margin-top: 140px;
  position: relative;
}
.error {
  color: red;
  padding: 10px 0;
  position: absolute;
  width: 100%;
  top: 21px;
  text-align: left;
}
</style>
