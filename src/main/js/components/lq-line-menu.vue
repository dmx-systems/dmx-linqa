<template>
  <el-dropdown class="lq-line-menu" size="medium" trigger="click" @command="handle">
    <span ref="trigger"></span>
    <el-dropdown-menu class="lq-line-dropdown" slot="dropdown">
      <el-dropdown-item command="arrowheads.none">
        <lq-svg-arrow arrowheads="none"></lq-svg-arrow>
      </el-dropdown-item>
      <el-dropdown-item command="arrowheads.start">
        <lq-svg-arrow arrowheads="start"></lq-svg-arrow>
      </el-dropdown-item>
      <el-dropdown-item command="arrowheads.end">
        <lq-svg-arrow arrowheads="end"></lq-svg-arrow>
      </el-dropdown-item>
      <el-dropdown-item command="arrowheads.start-end">
        <lq-svg-arrow arrowheads="start-end"></lq-svg-arrow>
      </el-dropdown-item>
      <el-dropdown-item command="line-style.none" divided><div class="style none"></div></el-dropdown-item>
      <el-dropdown-item command="line-style.dotted"><div class="style dotted"></div></el-dropdown-item>
      <el-dropdown-item command="line-style.dashed"><div class="style dashed"></div></el-dropdown-item>
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
  },

  components: {
    'lq-svg-arrow': require('./lq-svg-arrow').default
  }
}
</script>

<style>
/* the actual dropdown menus are body mounted */
.lq-line-dropdown .el-dropdown-menu__item {
  line-height: unset !important;
}

.lq-line-dropdown .el-dropdown-menu__item + .el-dropdown-menu__item {
  margin-top: 9px;
}

.lq-line-dropdown .style {
  position: relative;
  box-sizing: border-box;
  width: 50px;
  height: 30px;             /* 30px is original .el-dropdown-menu__item line-height */
  top: -13px;
  border-bottom-width: 4px;
  pointer-events: none;     /* make the outer menu-items the hot spots, not the top-moved divs */
}

.lq-line-dropdown .style.none {
  border-bottom-style: solid;
}

.lq-line-dropdown .style.dotted {
  border-bottom-style: dotted;
}

.lq-line-dropdown .style.dashed {
  border-bottom-style: dashed;
}
</style>
