<template>
  <el-dropdown class="lq-line-menu" trigger="click" @command="handle">
    <span ref="trigger"></span>
    <template #dropdown>
      <el-dropdown-menu class="lq-line-dropdown">
        <el-dropdown-item command="arrowheads.none">
          <lq-arrow-menu-item arrowheads="none"></lq-arrow-menu-item>
        </el-dropdown-item>
        <el-dropdown-item command="arrowheads.start">
          <lq-arrow-menu-item arrowheads="start"></lq-arrow-menu-item>
        </el-dropdown-item>
        <el-dropdown-item command="arrowheads.end">
          <lq-arrow-menu-item arrowheads="end"></lq-arrow-menu-item>
        </el-dropdown-item>
        <el-dropdown-item command="arrowheads.start-end">
          <lq-arrow-menu-item arrowheads="start-end"></lq-arrow-menu-item>
        </el-dropdown-item>
        <el-dropdown-item command="line-style.none" divided><div class="style none"></div></el-dropdown-item>
        <el-dropdown-item command="line-style.dotted"><div class="style dotted"></div></el-dropdown-item>
        <el-dropdown-item command="line-style.dashed"><div class="style dashed"></div></el-dropdown-item>
      </el-dropdown-menu>
    </template>
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
    'lq-arrow-menu-item': require('./lq-arrow-menu-item').default
  }
}
</script>

<style>
/* the actual dropdown menus are body mounted */

.lq-line-dropdown .el-dropdown-menu__item:hover .lq-arrow-menu-item line {
  stroke: var(--highlight-color-2);
}

.lq-line-dropdown .el-dropdown-menu__item:hover .lq-arrow-menu-item polygon  {
  fill: var(--highlight-color-2);
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
