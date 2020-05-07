<template>
  <div>
    <AuthLogicBasic>
      <div class="main">
        <div class="title titleLevel1">{{title}}</div>
        <Form ref="formCustom"
              :model="formCustom"
              :rules="ruleCustom">
          <FormItem prop="accountNumber"
                    class="accountNumber">
            <Input v-model="formCustom.accountNumber"
                   :placeholder="$t('common.account')"></Input>
          </FormItem>
          <FormItem prop="pwd"
                    class="pwd">
            <Input v-model="formCustom.pwd"
                   type="password"
                   :placeholder="$t('common.pwd')"></Input>
            <ErrorSf :msg="msg"></ErrorSf>
          </FormItem>
          <div class="login">
            <ButtonSf @click="handleSubmitBind('formCustom')">绑定</ButtonSf>
          </div>
          <router-link class="return"
                       to="/authLogic/newUser/matchFail">返回</router-link>
        </Form>
      </div>
    </AuthLogicBasic>
  </div>
</template>

<script>
import api from "@/api/authLogic/index.js";
import verify from "@/util/verify.js";
import skipPathUtil from "@/views/authLogic/skipLogic.js";
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
      if (value.length === 0 || value.length > 50) {
        callback(new Error("请输入不超过50位账号"));
      }
      let regx = verify.accountNumber;
      if (!regx.test(value)) {
        callback(new Error("请输入字符（英文不区分大小写）"));
      }
      callback();
    };
    // 密码校验
    const validatePhoneNumber = (rule, value, callback) => {
      this.msg = "";
      let regx = verify.accountNumber;
      if (value.length < 6) {
        callback(new Error("请输入不少于6位密码"));
      } else if (value.length > 30) {
        callback(new Error("请输入不超过30位密码"));
      }
      if (!regx.test(value)) {
        callback(new Error("请输入正确的密码"));
      }
      callback();
    };
    return {
      msg: "",
      formCustom: {
        accountNumber: "",
        pwd: ""
      },
      ruleCustom: {
        accountNumber: [
          { validator: validateName, trigger: "blur" }
        ],
        pwd: [
          { validator: validatePhoneNumber, trigger: "blur" }
        ]
      },
      clauseFlag: true,
      phoneNumberExist: false // 账号是否存在
    };
  },
  methods: {
    // 提交注册账号
    handleSubmitBind (name) {
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
          url: api.pwdChecked
        })
          .then(response => {
            if (
              response.data.return_code === 0
            ) {
              this.authLogic.userInfo.userId = response.data.userId;
              this.changeAuthLogic(this.authLogic);
              let skipPath = skipPathUtil.bindSkipNextPage(this.authLogic.binDingFlow, 1); // 跳到手机号验证或手机号验证下一步
              this.$router.push(skipPath);
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
    /deep/ .accountNumber {
      margin-bottom: 23px;
    }
    /deep/ .pwd {
      margin-bottom: 50px;
      .notice {
        text-align: left;
        font-size: 20px;
        padding-top: 6px;
        a {
          color: @colorBase1;
        }
      }
    }
    /deep/ .login {
      margin-bottom: 42px;
    }
  }
}
</style>
