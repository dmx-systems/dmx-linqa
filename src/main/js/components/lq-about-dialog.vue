<template>
  <el-dialog class="lq-about-dialog" :model-value="visible" width="95vw" @open="fetchText" @close="close">
    <img class="linqa-logo" src="/systems.dmx.linqa/linqa-logo.png">
    <div class="version">
      <span>2.2-SNAPSHOT</span>
      <span class="date">Jan 22, 2026</span>
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
          this.text[this.lang] = response.data
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
.lq-about-dialog {
  max-width: 600px;
  background-color: var(--header-color);
}

.lq-about-dialog .el-dialog__body {
  font-size: var(--secondary-font-size);
  color: var(--secondary-color);
}

.lq-about-dialog .lq-about-content {
  margin-left: 5px;
  margin-bottom: 10px;
}

.lq-about-content .dmx-html-field a {
  color: var(--primary-color) !important;
  text-decoration: none !important;
}

.lq-about-dialog .lq-about-content a {
  color: var(--primary-color) !important;
}

.lq-about-dialog .linqa-logo {
  height: 100px;
}

.lq-about-dialog .version {
  margin: 0px 24px 24px 0px;
  color: var(--primary-color);
  font-weight: bolder;
}

.lq-about-dialog .version .date {
  margin-left: 16px;
}
</style>
