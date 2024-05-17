<template>
  <el-dialog custom-class="lq-help-dialog" :visible="visible" width="350px" @open="open" @close="close">
    <transition>
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
      texts: [],    // array of String
      i: 0          // index of current text
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
    },

    next () {
      this.i++
      if (this.i === this.num) this.i = 0
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

.lq-help-dialog .text.v-enter {
  left: 100%
}

.lq-help-dialog .text.v-enter-to,
.lq-help-dialog .text.v-leave {
  left: 20px;
}

.lq-help-dialog .text.v-enter-active,
.lq-help-dialog .text.v-leave-active {
  transition: left .5s;
}

.lq-help-dialog .text.v-leave-to {
  left: -100%;
}
</style>
