<template>
  <div>
    <AuthLogicBasic>
      <div class="main">
        <p class="title titleLevel1">
          动态验证码
        </p>
        <Form ref="formCustom"
              :model="formCustom"
              :rules="ruleCustom">

          <FormItem prop="code">
            <Tooltip content="请打开赛赋TOTP小程序查看动态密码"
                     placement="right"
                     v-if="!canBindOtp">
              <Input v-model="formCustom.code"
                     placeholder="动态密码"></Input>
            </Tooltip>
            <Input v-else
                   v-model="formCustom.code"
                   placeholder="动态密码"></Input>
            <div v-if="canBindOtp"
                 class="can-bind-otp"
                 @click="getOtpQrcode">获取动态密码</div>
          </FormItem>
          <div class="login">
            <ButtonSf @click="handleSubmit('formCustom')">{{$t('common.submit')}}</ButtonSf>
          </div>
        </Form>
        <div v-if="errorNoticeObj.errorNotice"
             :class="errorNoticeObj">
          {{errorNoticeObj.msg}}
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
import AuthLogicBasic from "@/components/authLogic/AuthLogicBasic.vue";
import verify from "@/util/verify.js";
import { mapState } from "vuex";
export default {
  components: {
    AuthLogicBasic
  },
  data () {
    // 验证码校验
    const validateCode = (rule, value, callback) => {
      let regx = verify.verifyCode;
      if (!regx.test(value)) {
        callback(new Error("请输入6位验证码"));
      }
      callback();
    };
    return {
      isShowQRCode: false, // 是否显示获取otp码的二维码
      otpQrCode: "", // otp二维码
      errorNoticeObj: { errorNotice: false, msg: "" },
      formCustom: {
        code: ""
      },
      ruleCustom: {
        code: [
          { validator: validateCode, trigger: "blur" }
        ]
      }
    };
  },
  computed: {
    canBindOtp () {
      return this.authLogic.secondLoginInfo.otpBindKey === 0;
    },
    ...mapState({ authLogic: "authLogic" })
  },
  methods: {
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
    handleSubmit () {
      let params = { otpDynamicCode: this.formCustom.code };
      this.axios({
        method: "post",
        data: params,
        url: apiLogin.otpSecondCheck
      })
        .then(response => {
          if (response.data.return_code === 0
          ) {
            let skipPath = skipPathUtil.skipNextPage(this.authLogic.loginInfo, this.authLogic.secondLoginInfo, 6);
            this.$router.push({ path: skipPath });
          } else {
            this.errorNoticeObj.errorNotice = true;
            let errorMsg = response.data.return_msg;
            this.errorNoticeObj.msg = errorMsg;
            console.error(errorMsg);
          }
        })
        .catch(function (error) {
          this.axios.error.handlingErrors(error);
        });
    }
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
  .title {
    padding: 70px 0 100px 0;
  }
  .errorNotice {
    transition: all 0.3s ease-in-out;
    visibility: visible;
    color: red;
    padding: 10px 0;
  }
  .login {
    margin-top: 60px;
  }
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
</style>
