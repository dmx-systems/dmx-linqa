<template>
  <el-dialog :custom-class="`lq-help-dialog page-${index + 1}`" :visible="visible" width="820px" @open="fetchPages"
      @close="close">
    <el-carousel :autoplay="false" indicator-position="outside" trigger="click" height="492px" @change="change">
      <el-carousel-item v-for="(page, i) in pages" :label="i + 1" :key="i">
        <div class="page dmx-html-field" v-html="page"></div>
      </el-carousel-item>
    </el-carousel>
  </el-dialog>
</template>

<script>
export default {

  created () {
    // Note: if opened programmatically (onboarding) no "open" event is fired
    if (this.visible) {
      this.fetchPages()
    }
  },

  props: {
    visible: Boolean
  },

  data () {
    return {
      pages: [],          // array of HTML (String)
      index: 0            // index of current page (Number)
    }
  },

  methods: {

    fetchPages () {
      if (!this.pages.length) {
        this.$store.dispatch('getHelpPages').then(pages => {
          this.pages = pages
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
}

.lq-help-dialog .el-carousel__arrow--left {
  right: 45px;
}

.lq-help-dialog .el-carousel__arrow--right {
  right: 0;
}
</style>
