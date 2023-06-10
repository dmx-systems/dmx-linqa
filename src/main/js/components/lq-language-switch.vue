<template>
  <el-dropdown class="lq-language-switch" size="medium" trigger="click" @command="setLang">
    <el-button type="text" :title="selectTooltip">
      <span>{{lang.toUpperCase()}}</span><span class="el-icon-arrow-down el-icon--right"></span>
    </el-button>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item :command="lang1">{{lang1.toUpperCase()}}</el-dropdown-item>
      <el-dropdown-item :command="lang2">{{lang2.toUpperCase()}}</el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
import zw from '../lq-globals'

export default {

  computed: {

    lang () {
      return this.$store.state.lang
    },

    lang1 () {
      return this.$store.state.lang1
    },

    lang2 () {
      return this.$store.state.lang2
    },

    selectTooltip () {
      return zw.getString('tooltip.select_language')
    }
  },

  methods: {
    setLang (lang) {
      this.$store.dispatch('setLang', lang)
    }
  }
}
</script>
