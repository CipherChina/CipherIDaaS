<template>
  <div>
    <AuthLogicBasic>
      <div class="main">
        <div class="titleLevel1 title">{{title}}</div>
        <Form ref="formCustom"
              :model="formCustom"
              :rules="ruleCustom">
          <FormItem prop="userName"
                    class="userName">
            <Input v-model="formCustom.userName"
                   :placeholder="$t('common.name')"></Input>
          </FormItem>
          <FormItem prop="phoneNumber"
                    class="phoneNumber">
            <Input v-model="formCustom.phoneNumber"
                   :placeholder="$t('common.phone')"></Input>
            <div class="notice"
                 v-if="phoneNumberExist">{{$t('signUp.exist')}}
              <router-link class="notice"
                           to="/authLogic/login/staff/">{{$t('signUp.login')}}</router-link>
            </div>
            <!-- <ErrorSf :msg="msg"></ErrorSf> -->
          </FormItem>
           <FormItem prop="clauseFlag"
                    class="clauseFlag">
            <Checkbox v-model="formCustom.clauseFlag"
                      class="clause">{{$t('signUp.agree')}}<span @click="clause">{{$t('signUp.law')}}</span></Checkbox>
          </FormItem>
          <div class="login">
            <ButtonSf @click="handleSubmitRegist('formCustom')">{{$t('common.signUp')}}</ButtonSf>
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
  computed: {
    title () {
      return this.authLogic.portalConfig.rightTitle;
    },
    ...mapState({ authLogic: "authLogic" })
  },
  data () {
    // 姓名校验
    const validateName = (rule, value, callback) => {
      if (value.length === 0 || value.length > 100) {
        callback(new Error("姓名最长不能超过50字。"));
      }
      // let regx = verify.loginAccount;
      // let regx = /[\u4e00-\u9fa5a-zA-Z\d,.，。]+/;
      // if (!regx.test(value)) {
      //   callback(new Error("姓名最长不能超过50字。"));
      // }
      callback();
    };
    // 手机号校验
    const validatePhoneNumber = (rule, value, callback) => {
      this.msg = "";
      let regx = verify.phoneNumber;
      if (!regx.test(value)) {
        callback(new Error("请输入正确的手机号"));
      }
      callback();
    };
    const verifyItems = (rule, value, callback) => {
      if (!value) {
        return callback(new Error("请选择条款"));
      }
      callback();
    };
    return {
      msg: "",
      formCustom: {
        userName: "",
        phoneNumber: "",
        clauseFlag: ""
      },
      ruleCustom: {
        userName: [
          { validator: validateName, trigger: "blur" }
        ],
        phoneNumber: [
          { validator: validatePhoneNumber, trigger: "blur" }
        ],
        clauseFlag: [
          { validator: verifyItems, trigger: "blur" }
        ]
      },
      phoneNumberExist: false // 账号是否存在
    };
  },
  methods: {
    // 获取注册流程
    getRegistFlow () {
      this.axios({
        method: "post",
        data: {},
        url: api.registFlow
      })
        .then(response => {
          if (
            response.data.return_code === 0
          ) {
            let authLogic = Object.assign({}, this.authLogic, { registFlow: response.data.registFlow });
            this.changeAuthLogic(authLogic);
            this.regist();
          } else {
            let errorMsg = response.data.return_msg;
            console.error(errorMsg);
          }
        })
        .catch(function (error) {
          this.axios.error.handlingErrors(error);
        });
    },
    // 提交注册账号
    handleSubmitRegist (name) {
      this.$refs[name].validate((valid) => {
        if (!valid) {
          return;
        }
        if (!this.authLogic.registFlow) {
          this.getRegistFlow();
        } else {
          this.regist();
        }
      });
    },
    // 执行注册
    regist () {
      let params = {
        userName: this.formCustom.userName,
        phoneNumber: this.formCustom.phoneNumber
      };
      this.axios({
        method: "post",
        data: params,
        url: api.phoneNumberExist
      })
        .then(response => {
          if (
            response.data.return_code !== 0 // 手机号不存在
          ) {
            this.authLogic.userInfo.userName = this.formCustom.userName;
            this.authLogic.userInfo.phoneNumber = this.formCustom.phoneNumber;
            this.changeAuthLogic(this.authLogic);
            this.skipNextPage();
          } else { // 手机号存在
            this.phoneNumberExist = true;
            let errorMsg = "手机号已经存在，请更换手机号";
            // this.msg = errorMsg;
            console.error(errorMsg);
          }
        })
        .catch(function (error) {
          this.axios.error.handlingErrors(error);
        });
    },
    // 跳转到下一个页面
    skipNextPage () {
      let registFlow = this.authLogic.registFlow;
      let skipPath = "";
      let basePath = "/authLogic/newUserRegist/";
      if (registFlow.isOpenNumReg === 0) { // 手机验证
        skipPath = basePath + "phoneVerify";
      } else if (registFlow.isOpenMailReg === 0) { // 邮箱验证
        skipPath = basePath + "mailVerify";
      } else { // 等待审核
        skipPath = basePath + "waitReview";
      }
      this.$router.push({ path: skipPath });
    },
    clause () {
      this.$router.push("/authLogic/newUserRegist/clause");
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
  form {
    /deep/ .userName {
      margin-bottom: 23px;
    }
    /deep/ .phoneNumber {
      .notice {
        text-align: left;
        font-size: 14px;
        padding-top: 6px;
        a {
          color: @colorBase1;
        }
      }
    }
    /deep/ .login {
      margin-bottom: 12px;
    }
    /deep/ .clauseFlag {
      text-align: left;
      margin-bottom: 50px;
      /deep/ .ivu-form-item-content{
        line-height: 1;
        top: 2px;
      }
      .clause {
        font-size: 12px;
        color: @colorBase8;
        span {
          color: @colorBase4;
        }
      }
      .ivu-form-item-error-tip {
        margin-left: 28px;
      }
    }
  }
}
</style>
