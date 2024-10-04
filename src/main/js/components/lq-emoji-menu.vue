<template>
  <el-dropdown class="lq-emoji-menu" size="medium" trigger="click" @command="setEmoji">
    <span ref="trigger"></span>
    <el-dropdown-menu class="lq-emoji-dropdown" slot="dropdown">
      <el-dropdown-item v-for="emoji in emojis" :command="emoji" :key="emoji">
        <div>{{emoji}}</div>
      </el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
export default {

  data () {
    return {
      // emojis shown in the menu
      emojis: ['🙂', '👍', '👎', '💟', '✅']
    }
  },

  methods: {

    setEmoji (emoji) {
      this.$emit('select', emoji)
    },

    open () {
      this.$refs.trigger.click()
    }
  }
}
</script>

<style>
.lq-emoji-menu {
  position: absolute !important;    /* don't contribute to text flow */
}

/* the actual dropdown menus are body mounted */
.lq-emoji-dropdown .el-dropdown-menu__item + .el-dropdown-menu__item {
  margin-top: 4px;
}
</style>
