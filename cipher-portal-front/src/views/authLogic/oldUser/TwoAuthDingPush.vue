<template>
  <div>
    <AuthLogicBasic>
      <div class="main">
        <p class="title titleLevel1">
          CipherChina <br />{{$t('coomon.title')}}
        </p>
        <p class="content">
          <template v-if="isPushing">
            请打开钉钉，确认本次登录
          </template>
          <ButtonSf @click="tryAgain"
                    v-else>重试</ButtonSf>
        </p>
        <p class="footer">{{tip}}</p>
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
      tip: "等待确认中……",
      isPushing: true,
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
    ...mapState({ authLogic: "authLogic" })
  },
  mounted () {
    this.handleSubmit();
  },
  methods: {
    /**
     * 点击重试按钮调用，重新执行push请求
     * @param {*void}
     * @author yezi 2019-08-12
     */
    tryAgain () {
      this.handleSubmit();
    },
    /**
      * push请求，成功进入下一步，请求超时后台返回code 140
      * @param {*void}
      * @author yezi 2019-08-12
      */
    handleSubmit () {
      this.isPushing = true; // push请求中
      this.tip = "等待确认中……"; // 将提示 设置成等待确认
      // push认证接口
      this.axios({
        method: "post",
        data: {},
        url: apiLogin.dingPushSecondCheck
      })
        .then(response => {
          if (response.data.return_code === 0) {
            if (this.$route.path === "/authLogic/oldUser/twoAuthDingPush") {
              let skipPath = skipPathUtil.skipNextPage(this.authLogic.loginInfo, this.authLogic.secondLoginInfo, 3);
              this.$router.push({ path: skipPath });
            }
          } else if (response.data.return_code === 140) { // 登陆超时
            this.isPushing = false;
            this.tip = "等待超时,请点击重试后在钉钉确认本次登陆";
          } else { // 其他认证错误
            this.isPushing = false;
            this.tip = "认证失败,请点击重试后在钉钉确认本次登陆";
          }
        })
        .catch(function (error) {
          this.axios.error.handlingErrors(error);
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
  img {
    margin-top: 60px;
  }
  .title {
    padding: 70px 0 110px 0;
  }
  .content {
    font-size: @fontSize14;
  }
  .footer {
    position: absolute;
    bottom: 32px;
    left: 0;
    right: 0;
    color: @colorBase8;
    font-size: @fontSize14;
  }
}
</style>
