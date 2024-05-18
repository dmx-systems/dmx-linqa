<template>
  <el-dialog custom-class="lq-help-dialog" :visible="visible" width="820px" @open="open" @close="close">
    <transition :name="transition">
      <div :class="['page', `page-${i + 1}`]" v-html="page" :key="i"></div>
    </transition>
    <div slot="footer">
      <el-button round size="mini" icon="el-icon-arrow-left" @click="prev"></el-button>
      <el-button round size="mini" icon="el-icon-arrow-right" @click="next"></el-button>
    </div>
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
    },

    prev () {
      if (--this.i === -1) this.i = this.num - 1
      this.transition = 'slide-right'
    },

    next () {
      if (++this.i === this.num) this.i = 0
      this.transition = 'slide-left'
    }
  }
}
</script>

<style>
.lq-help-dialog {
  overflow: hidden;
}

.lq-help-dialog .page {
  /* position: absolute;
  white-space: nowrap; */
}

.lq-help-dialog .page.slide-left-enter,
.lq-help-dialog .page.slide-right-leave-to {
  left: 100%
}

.lq-help-dialog .page.slide-left-enter-to,
.lq-help-dialog .page.slide-left-leave,
.lq-help-dialog .page.slide-right-enter-to,
.lq-help-dialog .page.slide-right-leave {
  left: 20px;     /* 20px is .el-dialog__body left padding */
}

.lq-help-dialog .page.slide-left-enter-active,
.lq-help-dialog .page.slide-left-leave-active,
.lq-help-dialog .page.slide-right-enter-active,
.lq-help-dialog .page.slide-right-leave-active {
  transition: left .5s;
}

.lq-help-dialog .page.slide-left-leave-to,
.lq-help-dialog .page.slide-right-enter {
  left: -100%;
}
</style>
