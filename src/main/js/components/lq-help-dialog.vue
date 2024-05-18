<template>
  <el-dialog custom-class="lq-help-dialog" :visible="visible" width="820px" @open="open" @close="close">
    <el-carousel :autoplay="false" indicator-position="outside" trigger="click" height="360px">
      <el-carousel-item v-for="(page, i) in pages" :key="i">
        <div :class="['page', `page-${i + 1}`, 'dmx-html-field']" v-html="page"></div>
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
      pages: [],              // array of String
      i: 0,                   // index of current page
      transition: undefined   // transition name: 'slide-left' or 'slide-right'
    }
  },

  computed: {

    page () {
      return this.pages[this.i]
    },

    num () {
      return this.pages.length
    }
  },

  methods: {

    open () {
      if (!this.num) {
        this.$store.dispatch('getHelpPages').then(pages => {
          this.pages = pages
        })
      }
    },

    close () {
      this.$emit('close')
    }
  }
}
</script>

<style>
.lq-help-dialog {
}

.lq-help-dialog .el-dialog__header {
  padding: 0;
}

.lq-help-dialog .el-dialog__body {
  word-break: unset;    /* Element UI default is "break-all" */
}

.lq-help-dialog .page {
}
</style>
