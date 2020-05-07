<template>
  <div>
    <AuthLogicBasic>
      <div class="main">
        <div class="titleLevel1 title">邮箱验证</div>
        <Form ref="formCustom"
              :model="formCustom"
              :rules="ruleCustom">
          <FormItem prop="mail"
                    class="mail">
            <Input v-model="formCustom.mail"
                   placeholder="邮箱"></Input>
          </FormItem>
          <div class="code">
            <div>
              <FormItem prop="code"
                        :class="{'hiddenError':isHiddenError}">
                <Input v-model="formCustom.code"
                       placeholder="验证码"></Input>
                <ErrorSf :msg="msg"></ErrorSf>
              </FormItem>
            </div>
            <div class="getCode">
              <ButtonCode @click="getCode('formCustom')"
                          ref="timerbtn"></ButtonCode>
            </div>
          </div>
          <div class="login">
            <ButtonSf @click="handleSubmit('formCustom')">提交</ButtonSf>
          </div>
          <div class="skip"
               v-if="isSkipMailReg">
            <span @click="skipCurrentPage">跳过</span>
          </div>
        </Form>
      </div>
    </AuthLogicBasic>
  </div>
</template>

<script>
import api from "@/api/authLogic/index.js";
import verify from "@/util/verify.js";
import AuthLogicBasic from "@/components/authLogic/AuthLogicBasic.vue";
import { mapState, mapMutations } from "vuex";
export default {
  components: {
    AuthLogicBasic
  },
  data () {
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
      msg: "",
      isHiddenError: false, // 验证码input验证自带信息是否显示
      formCustom: {
        mail: "",
        code: ""
      },
      ruleCustom: {
        mail: [
          { required: true, message: "请输入正确的邮箱地址", trigger: "blur" },
          { type: "email", message: "请输入正确的邮箱地址", trigger: "blur" }
        ],
        code: [
          { validator: validateCode, trigger: "blur" }
        ]
      }
    };
  },
  computed: {
    isSkipMailReg () {
      return this.authLogic.registFlow.isSkipMailReg === 0; // true显示跳过，false不显示跳过
    },
    ...mapState({ authLogic: "authLogic" })
  },
  methods: {
    // 获取验证码
    getCode () {
      this.isHiddenError = true;
      let regx = verify.verifyEmail;
      if (!regx.test(this.formCustom.mail)) {
        this.msg = "请输入正确邮箱";
        return;
      }
      this.msg = "";
      this.$refs.timerbtn.setDisabled(true);
      let params = {
        mail: this.formCustom.mail
      };
      this.axios({
        method: "post",
        data: params,
        url: api.sendMailCode
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
            let intervalTime = response.data.interval_time;
            if (intervalTime !== null) {
              this.$refs.timerbtn.newStart(intervalTime);
            } else {
              this.$refs.timerbtn.start(); // 启动倒计时
            }
          }
        })
        .catch(function (error) {
          console.log(error);
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
          mail: this.formCustom.mail,
          code: this.formCustom.code
        };
        this.axios({
          method: "post",
          data: params,
          url: api.mailCodeChecked
        })
          .then(response => {
            if (
              response.data.return_code === 0
            ) {
              this.authLogic.userInfo.mail = this.formCustom.mail;
              this.changeAuthLogic(this.authLogic);
              this.skipNextPage();
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
    },
    // 跳过当前页面
    skipCurrentPage () {
      this.authLogic.userInfo.mail = "";
      this.changeAuthLogic(this.authLogic);
      this.skipNextPage();
    },
    // 跳转到下一个页面
    skipNextPage () {
      let skipPath = "";
      let basePath = "/authLogic/newUserRegist/";
      skipPath = basePath + "waitReview";
      this.$router.push({ path: skipPath });
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
    padding: 63px 0 66px 0;
  }
  .hiddenError /deep/ .ivu-form-item-error-tip {
    display: none;
  }
  form {
    .code {
      text-align: left;
      margin-bottom: 50px;
      position: relative;
    }
    /deep/ .login {
      margin-bottom: 42px;
    }
    .skip {
      color: @colorBase4;
      font-size: 12px;
      span {
        cursor: pointer;
        padding: 10px;
      }
    }
  }
}
</style>
