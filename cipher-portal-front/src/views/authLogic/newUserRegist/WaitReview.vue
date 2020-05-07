<template>
  <div>
    <AuthLogicBasic>
      <div class="main">
        <img src="@/assets/img/authLogic/logo.png"
             alt="">
        <div class="titleLevel1 titleTop">{{$t('signUp.success')}}</div>
        <div class="titleLevel2">{{$t('signUp.wait')}}</div>
      </div>
    </AuthLogicBasic>
  </div>
</template>

<script>
import api from "@/api/authLogic/index.js";
import AuthLogicBasic from "@/components/authLogic/AuthLogicBasic.vue";
import TYPE from "@/views/authLogic/constantType/index.js";
import { mapState, mapMutations } from "vuex";
export default {
  components: {
    AuthLogicBasic
  },
  computed: {
    scanWay () {
      return this.authLogic.scanWay;
    },
    title () {
      return this.authLogic.portalConfig.rightTitle;
    },
    ...mapState({ authLogic: "authLogic" })
  },
  created () {
    this.regist();
  },
  methods: {
    regist () {
      let userInfo = this.authLogic.userInfo;
      let params = {
        userName: userInfo.userName,
        phoneNumber: userInfo.phoneNumber,
        mail: userInfo.mail
      };
      switch (this.scanWay) {
        case TYPE.CIPHER:
          params.platId = this.authLogic.saiFuInfo.uuid || ""; // 注册时扫码的赛赋唯一id
          break;
        case TYPE.DABAI:
          params.idNum = this.authLogic.daBaiInfo.id_num || ""; // 注册时扫码的大白身份证号
          break;
        case TYPE.DINGDING:
          params.dingUserId = this.authLogic.dingTalkInfo.userId || ""; // 注册时扫码的钉钉用户id
          params.dingUnionId = this.authLogic.dingTalkInfo.unionId || ""; // 注册时扫码的钉钉组织id
          break;
        case TYPE.WX:
          params.wxUserId = this.authLogic.wxInfo.wxUserId || ""; // 注册时扫码的微信用户id
          break;
        default:
          break;
      }
      this.handleSubmitRegist(params);
    },
    handleSubmitRegist (params) {
      this.axios({
        method: "post",
        data: params,
        url: api.regist
      })
        .then(response => {
          if (
            response.data.return_code !== 0
          ) {
            let errorMsg = response.data.return_msg;
            console.log(errorMsg);
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
  img {
    width: 90px;
    height: 90px;
    margin: 100px 0 40px 0;
  }
  .titleTop {
    padding-bottom: 70px;
  }
}
</style>
