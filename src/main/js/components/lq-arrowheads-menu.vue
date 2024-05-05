<template>
  <el-dropdown class="lq-arrowheads-menu" size="medium" trigger="click" @command="setArrowheads">
    <span ref="trigger"></span>
    <el-dropdown-menu class="lq-arrowheads-dropdown" slot="dropdown">
      <el-dropdown-item command="none"><div class="none">&#9135;&#9135;</div></el-dropdown-item>
      <el-dropdown-item command="start"><div class="start">&#767;</div></el-dropdown-item>
      <el-dropdown-item command="end"><div class="end">&#767;</div></el-dropdown-item>
      <el-dropdown-item command="start-end"><div class="start-end">&#845;</div></el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
export default {

  props: {
    value: {                          // initial shape  // ### Needed?
      type: String,
      required: true
    }
  },

  methods: {

    setArrowheads (arrowheads) {
      this.$emit('input', arrowheads)
    },

    open () {
      this.$refs.trigger.click()
    }
  }
}
</script>

<style>
/* dropdown menus are body mounted */
.lq-arrowheads-dropdown .el-dropdown-menu__item + .el-dropdown-menu__item {
  margin-top: 9px;
}

.lq-arrowheads-dropdown .el-dropdown-menu__item > div {
  position: relative;
  font-size: 48px;
  pointer-events: none;     /* make the menu-items the hot spots */
}

.lq-arrowheads-dropdown .none {
  top: -6px;
}

.lq-arrowheads-dropdown .start {
  top: -12px;
}

.lq-arrowheads-dropdown .end {
  transform: rotate(180deg);
  top: 13px;
}

.lq-arrowheads-dropdown .start-end {
  top: -24px;
  left: 28px;
}
</style>
