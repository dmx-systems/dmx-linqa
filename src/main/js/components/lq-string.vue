<template>
  <div class="lq-string" v-if="html" v-html="string"></div>
  <span class="lq-string" v-else>{{string}}</span>
</template>

<script>
import zw from '../lq-globals'

export default {

  props: {
    html: Boolean,
    value: Number
  },

  computed: {

    string () {
      return zw.getString(this.key, this.value)
    },

    key () {
      return this.$slots.default[0].text
    }
  }
}
</script>
