<template>
  <span v-if="truncated !== undefined">{{truncated}}</span>
  <span v-else v-html="html" ref="html"></span>
</template>

<script>
const LIMIT = 120

export default {

  mounted () {
    this.truncate()
  },

  props: {
    html: String
  },

  data () {
    return {
      truncated: undefined
    }
  },

  watch: {
    html () {
      this.truncated = undefined
      this.$nextTick(this.truncate)
    }
  },

  methods: {
    truncate () {
      // Note: innerText is the empty string e.g. if the HTML consists of a sole <img> tag.
      // In this case we want render that empty string, not the HTML (see condition in template)
      let text = this.$refs.html.innerText
      if (text.length > LIMIT) {
        const i = text.lastIndexOf(' ', LIMIT)
        if (i >= 0) {
          text = text.substring(0, i + 1) + '...'
        }
      }
      this.truncated = text
    }
  }
}
</script>
