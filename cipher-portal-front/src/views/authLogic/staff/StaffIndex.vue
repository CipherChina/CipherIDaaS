<template>
  <div>
    <AuthLogicBasic>
      <p class="staffTitle">{{staffTitle}}</p>
      <div class="main">
        <div class="clearfix wrap">
          <div class="left">
            <img :src="staffImg">
          </div>
          <LoginHome class="right">
          </LoginHome>
        </div>
      </div>
    </AuthLogicBasic>
  </div>
</template>

<script>
import { mapState } from "vuex";
import AuthLogicBasic from "@/components/authLogic/AuthLogicBasic.vue";
import LoginHome from "@/components/authLogic/LoginHome.vue";
export default {
  components: {
    AuthLogicBasic,
    LoginHome
  },
  computed: {
    staffTitle () {
      return this.authLogic.portalConfig.title;
    },
    staffImg () {
      return this.authLogic.portalConfig.logo;
    },
    ...mapState({ authLogic: "authLogic" })
  }
};
</script>

<style lang="less" scoped>
@import "~@/assets/styles/authLogic/common.less";
.staffTitle {
  padding-top: 10px;
  font-size: 28px;
  color: @colorBase8;
  font-family: @fontBaseFamily;
  width: 50%;
}
.main {
  .authLogicOuther;
  top: 0;
  padding-top: 55px;
  height: 515px;
  .adminTitle {
    margin-bottom: 30px;
  }
  .wrap {
    width: 1200px;
    margin: 0 auto;
    height: 441px;
  }
  .clearfix {
    &::after,
    &::before {
      content: "";
      display: table;
    }
    &::after {
      clear: both;
    }
    .left,
    .right {
      width: 50%;
      float: left;
      position: relative;
      height: 100%;
    }
    .left {
      img {
        max-height: 100%;
        max-width: 100%;
        padding-left: 110px;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
    }
  }
}
</style>
