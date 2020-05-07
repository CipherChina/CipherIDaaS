<template>
  <div>
    <span @click="ok">
      <slot>提交</slot>
    </span>
  </div>
</template>

<script>
export default {
  methods: {
    ok () {
      this.$emit("click");
    }
  }
};
</script>

<style lang="less" scoped>
span {
  color: #fff;
  background-color: #2196FF;
  font-size: 14px;
  display: inline-block;
  width: 100%;
  text-align: center;
  height: 36px;
  line-height: 36px;
  border-radius: 2px;
  cursor: pointer;
}
</style>
