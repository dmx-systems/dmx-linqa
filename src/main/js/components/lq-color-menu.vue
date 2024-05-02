<template>
  <el-dropdown class="lq-color-menu" size="medium" trigger="click" @command="setColor">
    <span ref="trigger"></span>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item v-for="color in colors" :command="color" :key="color">
        <div :class="colorBoxClass(color)" :style="{'background-color': color}"></div>
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
import COLOR_PALETTE from '../lq-color-palette'

export default {

  props: {

    value: {                          // initial color
      type: String,
      required: true
    },

    palette: {                        // 'foreground'/'background' (default)
      type: String,
      default: 'background'
    }
  },

  data () {
    return {
      color: this.value,                        // selected color
      colors: COLOR_PALETTE[this.palette]       // available colors
    }
  },

  methods: {

    setColor (color) {
      this.color = color
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
  height: 50%;
}

/* dropdown menus are body mounted */
body > .el-dropdown-menu .color-box {
  margin-top: 9px;
  width: 40px;
  height: 30px;
}

body > .el-dropdown-menu .color-box.white,
body > .el-dropdown-menu .color-box.transparent {
  border: 1px solid var(--border-color-lighter);
}

body > .el-dropdown-menu .color-box.transparent {
  background-image: url("../../resources-build/grid.png");
  background-position: bottom right;
  background-size: 12px;
}
</style>
