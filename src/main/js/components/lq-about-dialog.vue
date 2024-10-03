<template>
  <el-dialog custom-class="lq-about-dialog" :visible="visible" @open="fetchText" @close="close">
    <img class="linqa-logo" src="/systems.dmx.linqa/linqa-logo.png">
    <div class="version">
      <span>2.0-SNAPSHOT</span>
      <span class="date">Oct 3, 2024</span>
    </div>
    <div class="dmx-html-field" v-html="text[lang]"></div>
  </el-dialog>
</template>

<script>
import http from 'axios'

export default {

  data () {
    return {
      text: {}     // the about text, per language, HTML (String)
    }
  },

  computed: {

    visible () {
      return this.$store.state.aboutVisibility
    },

    lang () {
      return this.$store.state.lang
    }
  },

  methods: {

    fetchText () {
      if (!this.text[this.lang]) {
        http.get(`/systems.dmx.linqa/about/about.${this.lang}.html`).then(response => {
          this.$set(this.text, this.lang, response.data)
        })
      }
    },

    close () {
      this.$store.dispatch('closeAboutDialog')
    }
  }
}
</script>

<style>
.lq-about-dialog .el-dialog__header {
  padding: 0;           /* Element UI default is "20px 20px 10px" */
}

.lq-about-dialog .el-dialog__body {
  background-color: var(--background-color);
  font-size: var(--secondary-font-size);
  color: var(--secondary-color);
  word-break: unset;    /* Element UI default is "break-all" */
}

.lq-about-dialog .linqa-logo {
  height: 84px;
}

.lq-about-dialog .version {
  margin: 24px 0;
}

.lq-about-dialog .version .date {
  margin-left: 16px;
}
</style>
