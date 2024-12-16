<template>
  <el-dialog :class="customClass" :model-value="visible" width="912px" @open="fetchPages" @close="close">
    <el-carousel :autoplay="false" indicator-position="outside" trigger="click" height="524px" @change="change">
      <el-carousel-item v-for="(page, i) in pages[langSuffix]" :label="i + 1" :key="i">
        <div class="page dmx-html-field" v-html="page"></div>
      </el-carousel-item>
    </el-carousel>
  </el-dialog>
</template>

<script>
import lq from '../lq-globals'

export default {

  created () {
    // Note: if opened programmatically (onboarding) no "open" event is fired
    if (this.visible) {
      this.fetchPages()
    }
  },

  props: {
    visible: Boolean,
    firstLogin: Boolean
  },

  data () {
    return {
      pages: {
        lang1: [],        // array of HTML (String)
        lang2: []         // array of HTML (String)
      },
      index: 0            // index of current page (Number)
    }
  },

  computed: {

    customClass () {
      return `lq-help-dialog page-${this.index + 1} ${this.firstLogin ? 'first-login' : ''}`
    },

    langSuffix () {
      return lq.langSuffix(this.lang)
    },

    lang () {
      return this.$store.state.lang
    }
  },

  methods: {

    fetchPages () {
      if (!this.pages[this.langSuffix].length) {
        this.$store.dispatch('getHelpPages').then(pages => {
          this.pages[this.langSuffix] = pages
        })
      }
    },

    close () {
      this.$emit('close')
    },

    change (index) {
      this.index = index
    }
  }
}
</script>

<style>
.lq-help-dialog .el-dialog__header {
  padding: 0;           /* Element UI default is "20px 20px 10px" */
}

.lq-help-dialog .el-dialog__body {
  word-break: unset;    /* Element UI default is "break-all" */
}

.lq-help-dialog .el-carousel__arrow {
  transition: unset;
  top: unset;
  left: unset;
  bottom: -45px;
  color: unset;
}

.lq-help-dialog .el-carousel__arrow--left {
  right: 45px;
}

.lq-help-dialog .el-carousel__arrow--right {
  right: 0;
}
</style>
