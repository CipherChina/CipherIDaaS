<template>
  <div>
    <AuthLogicBasic v-if="show">
      <div class="main">
        <div class="title titleLevel1">手机号验证</div>
        <Form ref="formCustom"
              :model="formCustom"
              :rules="ruleCustom">
          <FormItem prop="phoneNumber"
                    class="phoneNumber">
            <Input v-model="formCustom.phoneNumber"
                   :placeholder="$t('common.phone')"></Input>
          </FormItem>
          <div class="code">
            <div>
              <FormItem prop="code"
                        :class="{'hiddenError':isHiddenError}">
                <Input v-model="formCustom.code"
                       :placeholder="$t('common.SMSCode')"></Input>
                <ErrorSf :msg="msg"></ErrorSf>
              </FormItem>
            </div>
            <div class="getCode">
              <ButtonCode @click="getCode('formCustom')"
                          ref="timerbtn"></ButtonCode>
            </div>
          </div>
          <div class="login">
            <ButtonSf @click="handleSubmit('formCustom')">{{$t('common.submit')}}</ButtonSf>
          </div>
        </Form>
      </div>
    </AuthLogicBasic>
  </div>
</template>

<script>
import api from "@/api/authLogic/index.js";
import apiLogin from "@/api/authLogic/login.js";
import verify from "@/util/verify.js";
import AuthLogicBasic from "@/components/authLogic/AuthLogicBasic.vue";
import skipPathUtil from "@/views/authLogic/skipLogic.js";
import { mapState } from "vuex";
export default {
  components: {
    AuthLogicBasic
  },
  computed: {
    ...mapState({ authLogic: "authLogic" })
  },
  mounted () {
    this.getContactInfo();
  },
  data () {
    // 手机号校验
    const validatePhoneNumber = (rule, value, callback) => {
      let regx = verify.phoneNumber;
      if (!regx.test(value)) {
        callback(new Error("请输入正确的手机号"));
      }
      callback();
    };
    // 验证码校验
    const validateCode = (rule, value, callback) => {
      this.msg = "";
      this.isHiddenError = false;
      let regx = verify.verifyCode;
      if (!regx.test(value)) {
        callback(new Error("请输入6位验证码"));
      }
      callback();
    };
    return {
      show: false,
      msg: "",
      isHiddenError: false, // 验证码input验证自带信息是否显示
      formCustom: {
        phoneNumber: "",
        code: ""
      },
      ruleCustom: {
        phoneNumber: [
          { validator: validatePhoneNumber, trigger: "blur" }
        ],
        code: [
          { validator: validateCode, trigger: "blur" }
        ]
      }
    };
  },
  methods: {
    // 获取手机号和邮箱采集状态
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
            if (data.isPhoneCollect) { // 手机号未收集
              this.show = true;
              this.formCustom.phoneNumber = data.phoneNumber;
            } else { // 手机号已经收集
              // 一次认证后已经进行“信息采集”判断跳转到此页面，需要走是否进行二次认证判断流程
              this.authLogic.loginInfo.infoCollection = 1;
              let getSkipPath = skipPathUtil.getSkipPath(this.authLogic.loginInfo, this.authLogic.secondLoginInfo);
              this.$router.push(getSkipPath);
            }
          } else {
            let errorMsg = response.data.return_msg;
            console.error(errorMsg);
          }
        })
        .catch(function (error) {
          this.axios.error.handlingErrors(error);
        });
    },
    // 获取验证码
    getCode () {
      this.isHiddenError = true;
      let regx = verify.phoneNumber;
      if (!regx.test(this.formCustom.phoneNumber)) {
        this.msg = "请输入正确手机号";
        return;
      }
      this.msg = "";
      this.$refs.timerbtn.setDisabled(true);
      let params = {
        phoneNumber: this.formCustom.phoneNumber
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
            this.msg = errorMsg;
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
    handleSubmit (name) {
      this.$refs[name].validate((valid) => {
        if (!valid) {
          return;
        }
        let params = {
          phone: this.formCustom.phoneNumber,
          code: this.formCustom.code
        };
        this.axios({
          method: "post",
          data: params,
          url: apiLogin.collectPhoneNumber
        })
          .then(response => {
            console.log(response);
            console.log(this.authLogic);
            if (
              response.data.return_code === 0
            ) {
              this.authLogic.loginInfo.infoCollection = 1; // 后端返回采集成功，设置成不用判断采集状态
              let getSkipPath = skipPathUtil.getSkipPath(this.authLogic.loginInfo, this.authLogic.secondLoginInfo);
              this.$router.push({ path: getSkipPath });
            } else {
              this.phoneNumberExist = true;
              let errorMsg = response.data.return_msg;
              this.msg = errorMsg;
              console.error(errorMsg);
            }
          })
          .catch(function (error) {
            this.axios.error.handlingErrors(error);
          });
      });
    }
  }
};
</script>

<style lang="less" scoped>
@import "~@/assets/styles/authLogic/common.less";
.main {
  .authLogicOuther;
  .formsBody;
  .title {
    font-size: @fontSize24;
    padding: 63px 0 66px 0;
  }
  .hiddenError /deep/ .ivu-form-item-error-tip {
    display: none;
  }
  form {
    /deep/ .login {
      margin-bottom: 42px;
    }
  }
}
</style>
