<template>
  <el-dropdown class="lq-language-switch" size="medium" trigger="click" @command="setLang">
    <el-button type="text" :title="selectTooltip">
      <span>{{model.toUpperCase()}}</span><span class="el-icon-arrow-down el-icon--right"></span>
    </el-button>
    <el-dropdown-menu slot="dropdown">
      <el-dropdown-item :command="lang1">{{lang1.toUpperCase()}}</el-dropdown-item>
      <el-dropdown-item :command="lang2">{{lang2.toUpperCase()}}</el-dropdown-item>
    </el-dropdown-menu>
  </el-dropdown>
</template>

<script>
import lq from '../lq-globals'

export default {

  props: {
    value: String
  },

  computed: {

    model () {
      if (this.value) {       // v-model support is optional
        return this.value
      } else {
        return this.lang
      }
    },

    lang1 () {
      return this.$store.state.lang1
    },

    lang2 () {
      return this.$store.state.lang2
    },

    lang () {
      return this.$store.state.lang
    },

    selectTooltip () {
      return lq.getString('tooltip.select_language')
    }
  },

  methods: {
    setLang (lang) {
      if (this.value) {       // v-model support is optional
        this.$emit('input', lang)
      } else {
        this.$store.dispatch('setLang', lang)
      }
    }
  }
}
</script>
