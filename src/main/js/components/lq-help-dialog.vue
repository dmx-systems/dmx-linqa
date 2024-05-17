<template>
  <el-dialog custom-class="lq-help-dialog" :visible="visible" width="350px" @open="open" @close="close">
    <transition :name="transition">
      <div class="text" v-html="text" :key="i"></div>
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
      texts: [],              // array of String
      i: 0,                   // index of current text
      transition: undefined   // transition name: 'slide-left' or 'slide-right'
    }
  },

  computed: {

    text () {
      return this.texts[this.i]
    },

    num () {
      return this.texts.length
    }
  },

  methods: {

    open () {
      if (!this.num) {
        this.$store.dispatch('getHelpTexts').then(texts => {
          this.texts = texts
        })
      }
    },

    close () {
      this.$emit('close')
    },

    prev () {
      this.i--
      if (this.i === -1) this.i = this.num - 1
      this.transition = 'slide-right'
    },

    next () {
      this.i++
      if (this.i === this.num) this.i = 0
      this.transition = 'slide-left'
    }
  }
}
</script>

<style>
.lq-help-dialog {
  overflow: hidden;
}

.lq-help-dialog .text {
  position: absolute;
  white-space: nowrap;
}

.lq-help-dialog .text.slide-left-enter,
.lq-help-dialog .text.slide-right-leave-to {
  left: 100%
}

.lq-help-dialog .text.slide-left-enter-to,
.lq-help-dialog .text.slide-left-leave,
.lq-help-dialog .text.slide-right-enter-to,
.lq-help-dialog .text.slide-right-leave {
  left: 20px;
}

.lq-help-dialog .text.slide-left-enter-active,
.lq-help-dialog .text.slide-left-leave-active,
.lq-help-dialog .text.slide-right-enter-active,
.lq-help-dialog .text.slide-right-leave-active {
  transition: left .5s;
}

.lq-help-dialog .text.slide-left-leave-to,
.lq-help-dialog .text.slide-right-enter {
  left: -100%;
}
</style>
