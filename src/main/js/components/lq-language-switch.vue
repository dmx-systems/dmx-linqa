<template>
  <el-dropdown class="lq-language-switch" trigger="click" @command="setLang">
    <el-button type="primary" link :title="selectTooltip">
      <span>{{model.toUpperCase()}}</span>
      <el-icon class="el-icon--right"><arrow-down-bold></arrow-down-bold></el-icon>
    </el-button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item :command="lang1">{{lang1.toUpperCase()}}</el-dropdown-item>
        <el-dropdown-item :command="lang2">{{lang2.toUpperCase()}}</el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script>
import lq from '../lq-globals'

export default {

  props: {
    modelValue: String
  },

  computed: {

    model () {
      if (this.modelValue) {      // v-model support is optional, only used by lq-user-form
        return this.modelValue
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
      if (this.modelValue) {      // v-model support is optional
        this.$emit('update:modelValue', lang)
      } else {
        this.$store.dispatch('setLang', lang)
      }
    }
  }
}
</script>
