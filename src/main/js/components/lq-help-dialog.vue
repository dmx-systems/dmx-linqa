<template>
  <el-dialog :custom-class="`lq-help-dialog page-${index + 1}`" :visible="visible" width="820px" @open="fetchPages"
      @close="close">
    <el-carousel :autoplay="false" indicator-position="outside" trigger="click" height="480px" :initial-index="0"
        @change="change">
      <el-carousel-item v-for="(page, i) in pages" :label="page.label" :key="i">
        <div class="page dmx-html-field" v-html="page.html"></div>
      </el-carousel-item>
    </el-carousel>
  </el-dialog>
</template>

<script>
export default {

  props: {
    visible: Boolean
  },

  data () {
    return {
      pages: [],          // array of Object with 'label' and 'html' props
      index: 0            // index of current page (Number)
    }
  },

  methods: {

    fetchPages () {
      console.log('fetchPages')
      if (!this.pages.length) {
        this.$store.dispatch('getHelpPages').then(texts => {
          this.pages = texts.map(makePages)
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

function makePages (html) {
  const line = html.substring(0, html.indexOf('\n'))
  const label = line.substring(4, line.length - 5)
  return {label, html}
}
</script>

<style>
.lq-help-dialog {
}

.lq-help-dialog .el-dialog__header {
  padding: 0;           /* Element UI default is "20px 20px 10px" */
}

.lq-help-dialog .el-dialog__body {
  word-break: unset;    /* Element UI default is "break-all" */
}

.lq-help-dialog .page {
}
</style>
