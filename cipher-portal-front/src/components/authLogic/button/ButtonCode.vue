<template>
  <div>
    <span v-on:click="run"
          :disabled="isDisabled || time > 0"
          :class="{'disabled':isDisabled || time > 0}">{{ text }}</span>
  </div>
</template>

<script>
export default {
  props: {
    second: {
      type: Number,
      default: 60
    },
    disabled: {
      type: Boolean,
      default: false
    }
  },
  data: function () {
    return {
      time: 0,
      isDisabled: this.disabled
    };
  },
  methods: {
    run: function () {
      this.$emit("click");
    },
    start: function () {
      this.time = this.second;
      this.timer();
    },
    newStart: function (intervalTime) {
      this.time = intervalTime;
      this.timer();
    },
    stop: function () {
      this.time = 0;
      this.isDisabled = false;
    },
    setDisabled: function (val) {
      this.isDisabled = val;
    },
    timer: function () {
      if (this.time > 0) {
        this.time--;
        setTimeout(this.timer, 1000);
      } else {
        this.isDisabled = false;
      }
    }
  },
  computed: {
    text: function () {
      return this.time > 0 ? this.$t('common.resentCode')+" (" + this.time + "s)" : this.$t('common.sentCode');
    }
  }
};
</script>

<style lang="less" scoped>
span {
  color: #2196FF;
  cursor: pointer;
  position: absolute;
  top: 0;
  right: 0;
  font-size: 14px;
  &::before{
    content:'';
    display: inline-block;
    width:1px;
    height:19px;
    background:#DFE1E6;
    margin: 0 10px;
    position: relative;
    top: 6px;
  }
}
.disabled {
  pointer-events: none;
  cursor: not-allowed;
}
</style>
