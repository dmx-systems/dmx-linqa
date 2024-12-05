<template>
  <el-dropdown class="lq-color-menu" size="medium" trigger="click" @command="setColor">
    <span ref="trigger"></span>
    <template #dropdown>
      <el-dropdown-menu class="lq-color-dropdown">
        <el-dropdown-item v-for="color in colors" :command="color" :key="color">
          <div :class="colorBoxClass(color)" :style="{'background-color': color}"></div>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script>
import COLOR_PALETTE from '../lq-color-palette'

export default {

  props: {

    value: {                  // not used at the moment (for v-model)
      type: String,
      required: true
    },

    palette: {                // 'foreground'/'background' (default)
      type: String,
      default: 'background'
    },

    showTransparent: {        // whether the menu shows a "transparent" item, applies only to 'background' palette
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      // colors shown in the menu
      colors: COLOR_PALETTE[this.palette].filter(color => color !== 'transparent' || this.showTransparent)
    }
  },

  methods: {

    setColor (color) {
      this.$emit('input', color)
    },

    colorBoxClass (color) {
      const classes = ['color-box']
      if (color === 'white' || color === 'transparent') {     // 'white' and 'transparent' get extra style
        classes.push(color)
      }
      return classes
    },

    open () {
      this.$refs.trigger.click()
    }
  }
}
</script>

<style>
.lq-color-menu {
  position: absolute !important;    /* don't contribute to text flow */
}

/* the actual dropdown menus are body mounted */
.lq-color-dropdown .el-dropdown-menu__item + .el-dropdown-menu__item {
  margin-top: 9px;
}

.lq-color-dropdown .color-box {
  width: 40px;
  height: 30px;
}

.lq-color-dropdown .color-box.white,
.lq-color-dropdown .color-box.transparent {
  border: 1px solid var(--border-color-lighter);
}

.lq-color-dropdown .color-box.transparent {
  background-image: url("../../resources-build/grid.png");
  background-position: bottom right;
  background-size: 12px;
}
</style>
