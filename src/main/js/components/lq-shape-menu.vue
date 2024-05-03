<template>
  <el-dropdown class="lq-shape-menu" size="medium" trigger="click" @command="setShape">
    <span ref="trigger"></span>
    <el-dropdown-menu class="lq-shape-dropdown" slot="dropdown">
      <el-dropdown-item command="rectangle">
        <div class="rectangle" :style="style"></div>
      </el-dropdown-item>
      <el-dropdown-item command="ellipse">
        <div class="ellipse" :style="style"></div>
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
export default {

  props: {

    value: {                          // initial shape  // ### Needed?
      type: String,
      required: true
    },

    color: {                          // color to draw the shape items
      type: String,
      required: true
    }
  },

  computed: {
    style () {
      return {
        'background-color': this.color
      }
    }
  },

  methods: {

    setShape (shape) {
      this.$emit('input', shape)
    },

    open () {
      this.$refs.trigger.click()
    }
  }
}
</script>

<style>
.lq-shape-menu {
  height: 50%;
}

/* dropdown menus are body mounted */
.lq-shape-dropdown .el-dropdown-menu__item + .el-dropdown-menu__item {
  margin-top: 9px;
}

.lq-shape-dropdown .rectangle {
  margin: 0 auto;
  width: 36px;
  height: 27px;
}

.lq-shape-dropdown .ellipse {
  width: 40px;
  height: 30px;
  border-radius: 50%;
}
</style>
