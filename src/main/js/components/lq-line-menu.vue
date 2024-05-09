<template>
  <el-dropdown class="lq-line-menu" size="medium" trigger="click" @command="handle">
    <span ref="trigger"></span>
    <el-dropdown-menu class="lq-line-dropdown" slot="dropdown">
      <el-dropdown-item command="arrowheads.none"><div class="arrow none">&#9135;&#9135;</div></el-dropdown-item>
      <el-dropdown-item command="arrowheads.start"><div class="arrow start">&#767;</div></el-dropdown-item>
      <el-dropdown-item command="arrowheads.end"><div class="arrow end">&#767;</div></el-dropdown-item>
      <el-dropdown-item command="arrowheads.start-end"><div class="arrow start-end">&#845;</div></el-dropdown-item>
      <el-dropdown-item command="line-style.none" divided><div class="style none">none</div></el-dropdown-item>
      <el-dropdown-item command="line-style.dotted"><div class="style dotted">dotted</div></el-dropdown-item>
      <el-dropdown-item command="line-style.dashed"><div class="style dashed">dashed</div></el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
export default {
  methods: {

    handle (command) {
      const c = command.split('.')
      this.$emit(c[0], c[1])
    },

    open () {
      this.$refs.trigger.click()
    }
  }
}
</script>

<style>
/* dropdown menus are body mounted */
.lq-line-dropdown .el-dropdown-menu__item + .el-dropdown-menu__item {
  margin-top: 9px;
}

.lq-line-dropdown .el-dropdown-menu__item > div {
  position: relative;
  font-size: 48px;
  pointer-events: none;     /* make the menu-items the hot spots */
}

.lq-line-dropdown .arrow.none {
  top: -6px;
}

.lq-line-dropdown .arrow.start {
  top: -12px;
}

.lq-line-dropdown .arrow.end {
  transform: rotate(180deg);
  top: 13px;
}

.lq-line-dropdown .arrow.start-end {
  top: -24px;
  left: 28px;
}
</style>
