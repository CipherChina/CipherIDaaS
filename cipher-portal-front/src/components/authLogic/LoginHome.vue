<template>
  <div>
    <div class="body">
      <p class="titleLevel1 loginHomeTitle">{{title}}</p>
      <!-- 账号密码登录 -->
      <Form v-if="accountFlag"
            ref="formCustom"
            key="accountNumber"
            :model="formCustom"
            :rules="ruleCustom">
        <FormItem prop="accountNumber">
          <Input v-model="formCustom.accountNumber"
                 :placeholder="$t('common.account')"></Input>
        </FormItem>
        <FormItem prop="pwd"
                  class="passwordVerifyCode">
          <Input :type="pwdSetting.type"
                 v-model="formCustom.pwd"
                 :placeholder="$t('common.pwd')"
                 :icon="pwdSetting.pwdIcon"
                 @click.native="changePwdType"
                 @on-enter="handleSubmitAccount('formCustom')">
          </Input>
          <div class="verifyMode">
            <span class="errorMsg"
                  :class="{'only-error':authLogic.modes.otherAuthNum}">{{errorMsgAccount}}</span>
          </div>
        </FormItem>
        <div class="else-info">
          <span @click="switchLoginWay(false)" class="accountAuth"
            v-if="!authLogic.modes.otherAuthNum">{{$t('login.mobileLogin')}}</span>
          <Checkbox v-model="rememberLogin" class="remember">{{$t('login.remember')}}</Checkbox>
        </div>
        <FormItem class="login">
          <Button type="primary"
                  @click="handleSubmitAccount('formCustom')">{{$t('common.signIn')}}</Button>
        </FormItem>
      </Form>
      <!-- 手机验证码登录 -->
      <Form v-else
            ref="formCustomVerify"
            key="verifyCode"
            :model="formCustomVerify"
            :rules="ruleCustomVerify">
        <FormItem prop="phoneNumber">
          <Input v-model="formCustomVerify.phoneNumber"
                :placeholder="$t('common.phone')"></Input>
        </FormItem>
        
        <div class="code"
               :class="{'hiddenError':isHiddenError}">
            <FormItem prop="verifyCode">
              <Input v-model="formCustomVerify.verifyCode"
                     :placeholder="$t('common.SMSCode')"></Input>
            </FormItem>
            <div class="getCode">
              <ButtonCode @click="getCode"
                          ref="timerbtn"></ButtonCode>
            </div>
            <div class="verifyMode">
              <span class="errorMsg">{{errorMsgVerify}}</span>
            </div>
            <div class="else-info">
              <span class="accountAuth"  @click="switchLoginWay(true)" v-if="!authLogic.modes.otherAuthNum">{{$t('login.accountLogin')}}</span>
            </div>
        </div>
        <FormItem class="login">
          <Button type="primary"
                  @click="handleSubmitVerify('formCustomVerify')">{{$t('common.signIn')}}</Button>
        </FormItem>
      </Form>
       <div class="regist-forget"
           v-if="isRegist">
        <router-link to="/authLogic/newUserRegist/accountRegist">
          <span class="select" v-if="isRegist">{{ $t("login.signUp")}}</span>
        </router-link>
        <span v-if="isRegist&&isForget" class="tag"></span>
        <span class="select"
              @click="getForgetPasswordFlow" v-if="isForget">{{$t('login.forget')}}</span>
      </div>
      <p class="otherLoginText"
        v-if="logoLength!==0">
        <span class="text">{{$t('common.otherLogin')}}<Icon type="ios-arrow-down" /></span>
      </p>
      <div class="otherLogin">
        <template v-for="item in logoItems">
          <span :key="item.index"
                v-if="item.show"
                @mouseenter="mouseEnter(item.index)"
                @mouseleave="mouseLeave"
                :class="setClass(item.index,item)"
                @click="scan(item)">
          </span>
        </template>
      </div>
    </div>
  </div>
</template>
<script>
import api from "@/api/authLogic/index.js";
import apiLogin from "@/api/authLogic/login.js";
import apiForget from "@/api/authLogic/fogetPassword.js";
import skipPathUtil from "@/views/authLogic/skipLogic.js";
import verify from "@/util/verify.js";
import util from "@/views/authLogic/util/index.js";
import { mapState, mapMutations } from "vuex";
export default {
  data () {
    // 账号校验
    const validateAccount = (rule, value, callback) => {
      this.errorMsgAccount = "";
      if (value.length === 0 || value.length > 50) {
        callback(new Error("请输入不超过50位账号"));
      }
      let regx = verify.loginAccount;
      if (!regx.test(value)) {
        callback(new Error("请输入字符（英文不区分大小写）"));
      }
      callback();
    };
    // 密码校验
    const validatePass = (rule, value, callback) => {
      this.errorMsgAccount = "";
      if (value.length === 0 || value.length < 6) {
        callback(new Error("请输入不少于6位密码"));
      } else if (value.length > 30) {
        callback(new Error("请输入不超过30位密码"));
      }
      let regx = verify.accountNumber;
      if (!regx.test(value)) {
        callback(new Error("请输入字符（英文不区分大小写）"));
      }
      callback();
    };
    // 验证码校验
    const validateVerifyCode = (rule, value, callback) => {
      this.errorMsgVerify = "";
      this.isHiddenError = false;
      if (!verify.verifyCode.test(value)) {
        callback(new Error("请输入6位验证码"));
      }
      let regx = verify.accountNumber;
      if (!regx.test(value)) {
        callback(new Error("请输入字符（英文不区分大小写）"));
      }
      callback();
    };
    // 手机号校验
    const validatePhoneNumber = (rule, value, callback) => {
      this.errorMsgVerify = "";
      let regx = verify.phoneNumber;
      if (!regx.test(value)) {
        callback(new Error("请输入正确的手机号"));
      }
      callback();
    };
    return {
      rememberLogin: false, // 是否记住用户名
      errorMsgAccount: "", // 账户密码方式后端接口返回错误信息
      errorMsgVerify: "", // 手机验证码方式后端接口返回错误信息
      isHiddenError: false, // 验证码input验证自带信息是否显示
      accountFlag: true, // true账号登录，false手机随机码登录
      pwdSetting:{
        type:"password",
        pwdIcon:"ios-eye-outline"
      },
      // 账号密码登录
      formCustom: {
        accountNumber: "",
        pwd: "" // 密码
      },
      ruleCustom: {
        accountNumber: [
          { validator: validateAccount, trigger: "blur" }
        ],
        pwd: [
          { validator: validatePass, trigger: "blur" }
        ]
      },
      // 手机验证码登录
      formCustomVerify: {
        phoneNumber: "",
        verifyCode: "" // 验证码
      },
      ruleCustomVerify: {
        phoneNumber: [
          { validator: validatePhoneNumber, trigger: "blur" }
        ],
        verifyCode: [
          { validator: validateVerifyCode, trigger: "blur" }
        ]
      },
      isActive: false
    };
  },
  computed: {
    title () {
      return this.authLogic.portalConfig.rightTitle;
    },
    logoItems () {
      return util.logoItems(this.authLogic.modes);
    },
    logoLength () { // 选择扫码方式的个数
      let array = util.logoItems(this.authLogic.modes);
      let temp = array.filter(function (elem) {
        return elem.show === true;
      });
      return temp.length;
    },
    isRegist () {
      return this.authLogic.registMode.regist === 0;
    },
    isForget () {
      return this.authLogic.registMode.forget === 0;
    },
    ...mapState({ authLogic: "authLogic" })
  },
  created(){
    let userInfo=this.setStorage("userInfo");
    if(userInfo){
      this.formCustom.accountNumber=userInfo.accountNumber;
      this.formCustom.pwd=userInfo.pwd;
    }
  },
  methods: {
    // input密码状态切换
    changePwdType () {
      this.pwdSetting.type=this.pwdSetting.type==="password"?"text":"password";
      this.pwdSetting.pwdIcon=this.pwdSetting.pwdIcon==="ios-eye-outline"?"ios-eye-off-outline":"ios-eye-outline";
    },
    // 切换登录方式：1.账号密码登录;2.手机随机码登录
    switchLoginWay (flag) {
      this.accountFlag = flag;
      // this.handleReset("formCustom");
      // this.handleReset("formCustomVerify");
    },
    // 账号密码登录提交
    handleSubmitAccount (name) {
      this.$refs[name].validate((valid) => {
        if (!valid) {
          return;
        }
        let params = {
          accountNumber: this.formCustom.accountNumber,
          pwd: this.formCustom.pwd
        };
        this.axios({
          method: "post",
          data: params,
          url: apiLogin.pwdLoginChecked
        })
          .then(response => {
            if (
              response.data.return_code === 0
            ) {
              // 清除错误信息
              this.errorMsgAccount = "";
              if (this.rememberLogin === true) {
                // 传入保存的key值，保存值，和保存天数3个参数
                this.setStorage("userInfo",params, 7);
              } else {
                localStorage.removeItem('userinfo')
              }
              this.loginSkip(response);
            } else {
              let errorMsg = response.data.return_msg;
              this.errorMsgAccount = errorMsg;
              console.error(errorMsg);
            }
          })
          .catch(function (error) {
            this.axios.error.handlingErrors(error);
          });
      });
    },
    // 手机验证码登录提交
    handleSubmitVerify (name) {
      this.$refs[name].validate((valid) => {
        if (!valid) {
          return;
        }
        let params = {
          phoneNumber: this.formCustomVerify.phoneNumber,
          code: this.formCustomVerify.verifyCode
        };
        this.axios({
          method: "post",
          data: params,
          url: apiLogin.phoneCodeLogin
        })
          .then(response => {
            if (
              response.data.return_code === 0
            ) {
              this.errorMsgVerify = ""; // 清除错误信息
              this.loginSkip(response);
            } else {
              let errorMsg = response.data.return_msg;
              this.errorMsgVerify = errorMsg;
              console.error(errorMsg);
            }
          })
          .catch(function (error) {
            this.axios.error.handlingErrors(error);
          });
      });
    },
    handleReset (name) {
      this.$refs[name].resetFields();
    },
    // 扫码方式
    scan (scanWay) {
      let obj = { path: "/authLogic/login/scan", query: { scanWay: scanWay.logo } };
      this.$router.push(obj);
    },
    // 鼠标进入
    mouseEnter (index) {
      this.isActive = index;
    },
    // 鼠标离开
    mouseLeave () {
      this.isActive = null;
    },
    setClass (index, item) {
      return { logo: true, [item.logo]: true, active: index === this.isActive };
    },
    // 获取验证码
    getCode () {
      this.isHiddenError = true;
      let regx = verify.phoneNumber;
      if (!regx.test(this.formCustomVerify.phoneNumber)) {
        this.errorMsgVerify = "请输入正确手机号";
        return;
      }
      this.errorMsgVerify = "";
      this.$refs.timerbtn.setDisabled(true);
      let params = {
        phoneNumber: this.formCustomVerify.phoneNumber
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
            this.errorMsgVerify = errorMsg;
            console.error(errorMsg);
          } else {
            this.$refs.timerbtn.start(); // 启动倒计时
          }
        })
        .catch(function (error) {
          this.$refs.timerbtn.stop(); // 停止倒计时
          this.axios.error.handlingErrors(error);
        });
      // });
    },
    // 登录跳转
    loginSkip (response) {
      let data = response.data;
      let temp = {
        loginInfo: data.loginInfo,
        secondLoginInfo: data.secondLoginInfo
      };
      temp.userInfo = {};
      temp.userInfo.userId = data.loginInfo.userId;
      let authLogic = Object.assign({}, this.authLogic, temp);
      this.changeAuthLogic(authLogic);
      let getSkipPath = skipPathUtil.getSkipPath(authLogic.loginInfo, authLogic.secondLoginInfo);
      this.$router.push(getSkipPath);
    },
    // 获取忘记密码流程信息
    getForgetPasswordFlow () {
      this.axios({
        method: "post",
        data: {},
        url: apiForget.forgetPwdFlow
      })
        .then(response => {
          if (
            response.data.return_code === 0
          ) {
            this.forgetPasswordSkip(response);
          } else {
            let errorMsg = response.data.return_msg;
            this.errorMsgVerify = errorMsg;
            console.error(errorMsg);
          }
        })
        .catch(function (error) {
          this.axios.error.handlingErrors(error);
        });
    },
    // 忘记密码跳转
    forgetPasswordSkip (response) {
      let temp = {
        forgetPwdFlow: response.data.forgetPwdFlow
      };
      let authLogic = Object.assign({}, this.authLogic, temp);
      this.changeAuthLogic(authLogic);
      let getForgetSkipPath = skipPathUtil.fogetPWSkipNextPage(authLogic.forgetPwdFlow, 1);
      this.$router.push(getForgetSkipPath);
    },
    // set Storage
    setStorage(name,value,expires){
      var time = new Date();
      time.setTime(time.getTime()+expires*60*60*1000);
      if(localStorage.getItem(name)){
        return;
      }
      localStorage.setItem(name,JSON.stringify({value:value,expires:time.getTime()}));
    }, 
    getStorage(name){
      var storages = localStorage.getItem(name);
      if(!storages) return;
      storages = JSON.parse(storages);
      var expires =  storages.expires;
      var currTime = new Date();
      currTime = currTime.getTime();
      if(currTime - expires >= 0){
        localStorage.removeItem(name);
        return undefined;
      }else{
        return storages.value;
      }
    } ,
    ...mapMutations(["changeAuthLogic"])
  }
};
</script>

<style lang="less" scoped>
@import "~@/assets/styles/authLogic/common.less";
.body {
  .titleLevel1;
  margin: auto;
  width: 380px;
  background:rgba(255,255,255,1);
  box-shadow:0px 10px 20px 0px rgba(0, 0, 0, 0.1);
  padding: 25px 38px;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  .loginHomeTitle {
    margin-bottom: 40px;
  }
  // .titleLevel3 {
  //   margin-bottom: 45px;
  // }
  .hiddenError /deep/ .ivu-form-item-error-tip {
    display: none;
  }
  .passwordVerifyCode {
    margin-bottom: 40px;
    .verifyMode {
      position: absolute;
      width: 100%;
      right: 0;
      // bottom: -28px;
      font-size: @fontSize14;
      & > span {
        width: 50%;
        display: inline-block;
      }
      .errorMsg {
        color: @colorError;
        font-size: 12px;
        text-align: left;
      }
      .only-error {
        width: 100% !important;
      }
      .hidden {
        visibility: hidden;
      }
    }
  }
  .else-info{
    position: relative;
    top:-19px;
    .clear;
    line-height: 1;
    .accountAuth{
      float: left;
      font-size: 12px;
      cursor: pointer;
    }
    .remember{
      float: right;
    }

  }
  .login {
    margin-bottom: 0px;
    /deep/ button {
      background-color: @colorBase4;
      border-color: @colorBase4;
      /deep/ span {
        color: #fff;
        font-size: @fontSize16;
      }
    }
  }
  .otherLogin {
    .scanLogin;
  }
  .regist-forget{
    margin-top:10px;
   .select {
      color: @colorBase8;
      font-size: @fontSize12;
      text-decoration: none;
      &:hover {
        .mouseHover;
      }
    }
    .tag{
      display: inline-block;
      width:1px;
      height:12px;
      background:rgba(223,225,230,1);
      margin:0 26px;
    }
  }
  //机随机码
  .code {
    position: relative;
    text-align: left;
    .verifyMode {
      position: absolute;
      top:30px;
      .errorMsg {
        color: @colorError;
        font-size: 12px;
        text-align: left;
      }
    }
    .else-info{
      margin-top:42px;
      top:-22px;
    }
  }
}
</style>
