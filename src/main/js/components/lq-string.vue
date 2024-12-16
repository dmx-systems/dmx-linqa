<template>
  <div class="lq-string" v-if="html" v-html="string"></div>
  <span class="lq-string" v-else>{{string}}</span>
</template>

<script>
import lq from '../lq-globals'

export default {

  props: {
    html: Boolean,
    value: [Number, String]
  },

  computed: {

    string () {
      return lq.getString(this.key, this.value)
    },

    key () {
      return this.$slots.default()[0].children.trim()
    }
  }
}
</script>
