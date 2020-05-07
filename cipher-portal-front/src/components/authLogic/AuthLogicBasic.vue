<template>
  <div class="authLogicBody">
    <div class="header">
      <router-link to="/authLogic/login/staff/">
        <img class="logo"
             :src="iconfont">
      </router-link>
      <span class="title">{{logoTitle}}</span>
      <div class="switch-language">
        <img src="@/assets/img/authLogic/EN.png" @click="switchLanguage('en')"/>
        <span @click="switchLanguage('zh')">简体中文</span>
        <Icon type="ios-arrow-down" />
      </div>
    </div>
    <div class="middle">
      <slot>
        中间内容
      </slot>
    </div>
    <div class="footer">
      {{copyRight}}
    </div>
  </div>
</template>

<script>
import { mapState} from "vuex";
export default {
  computed: {
    logoTitle () {
      return this.authLogic.portalConfig.leftTitle;
    },
    iconfont () {
      return this.authLogic.portalConfig.iconfont;
    },
    copyRight () {
      return this.authLogic.portalConfig.copyright;
    },
    ...mapState({ authLogic: "authLogic" })
  },
  methods:{
    switchLanguage(lang){
      this.$i18n.locale=lang;
      localStorage.setItem("lang",lang);
    }
  }
};
</script>

<style lang="less" scoped>
@import "~@/assets/styles/authLogic/common.less";
.authLogicBody {
  height: 100%;
  min-width: 1200px;
  //min-height: 630px;
  color: #93c0cd;
  background-image: url("~@/assets/img/bg.png");
  background-position: 0px 0px;
  background-size:cover;
  .header {
    text-align: left;
    padding: 20px 0 0 20px;
    font-size: 16px;
    position: relative;
    .logo {
      vertical-align: middle;
      height: 30px;
      width: auto;
    }
    .title {
      color: @colorBase8;
      font-size: 18px;
      padding-left: 15px;
      font-family: @fontBaseFamily;
      vertical-align: middle;
    }
    .switch-language{
      position: absolute;
      right: 20px;
      top: 20px;
      width:130px;
      height:40px;
      line-height: 40px;
      padding: 0 9px;
      background:rgba(255,255,255,1);
      border:1px solid rgba(161, 171, 187, 1);
      border-radius:5px;
      color: #8F97A3;
      span{
        font-size: 14px;
        margin:0 8px;
        position: relative;
        top: -1px;
        cursor: pointer;
      }
      img{
        position: relative;
        top: 5px;
        cursor: pointer;
      }
      i{
        color: #8F97A3;
      }
    }
  }
  .middle {
    position: relative;
    height: calc(~"100% - 88px");
  }
  >.footer {
    background-color: #6FB7CF;
    color: #fff;
    font-size: @fontSize14;
    padding: 10px;
  }
}
</style>
