<template>
  <el-dialog :class="customClass" :model-value="visible" @open="fetchPages" @close="close">
       <el-tabs @select="select" v-model="page" tab-position="left">
    <el-tab-pane v-for="(page, i) in pages[langSuffix]" :name="i.toString()" :label="page.label"><div class="page dmx-html-field" v-html="page?.html"></div></el-tab-pane>
  </el-tabs>
  </el-dialog>
</template>

<script>
import lq from '../lq-globals'

export default {

  created () {
    // Note: if opened programmatically (onboarding) no "open" event is fired
    if (this.visible) {
      this.fetchPages()
    }
  },

  props: {
    visible: Boolean,
    firstLogin: Boolean
  },

  data () {
    return {
      pages: {
        lang1: [],        // array of HTML (String)
        lang2: []         // array of HTML (String)
      },
      page: '0'           // index of current page (String)
    }
  },

  computed: {

    customClass () {
      return `lq-help-dialog page-${this.page} ${this.firstLogin ? 'first-login' : ''}`
    },

    langSuffix () {
      return lq.langSuffix(this.lang)
    },

    lang () {
      return this.$store.state.lang
    }
  },

  methods: {

    fetchPages () {
      if (!this.pages[this.langSuffix].length) {
        this.$store.dispatch('getHelpPages').then(pages => {
          this.pages[this.langSuffix] = pages.map(makePages)
        })
      }
    },

    select (page) {
      this.page = page
    },

    close () {
      this.$emit('close')
    }
  }
}

function makePages (html) {
  const line = html.substring(0, html.indexOf('\n'))
  const label = line.substring(4, line.length - 5)
  return {label, html}
}
</script>

<style>
.lq-help-dialog {
  --el-dialog-width: 94%;         /* default is 50% */
  --el-dialog-margin-top: 5vh;    /* default is 15vh */
  --el-menu-item-height: 36px;    /* default is 56px */
  height: 90%;
  padding-left: 0;                /* padding is provided by el-menu already */
  padding-right: 0;               /* no padding right of content scrollbar */
  margin-bottom: 0;               /* avoid vertical dialog scrollbar */
  overflow: hidden;               /* in case menu exceeds dialog vertically */
}

.lq-help-dialog .el-dialog__headerbtn {
  width: 30px;                    /* reposition button, default is 48px */
  height: 36px;                   /* reposition button, default is 48px */
}

.lq-help-dialog .el-dialog__body {
  display: flex;
  height: 100%;
}

.lq-help-dialog h1, .lq-help-dialog h2 {
  color: var(--primary-color);
}

.lq-help-dialog .hint {
  background-color: var(--light-color);
}

.lq-help-dialog .page {
  overflow-y: auto;
  margin-left: 20px;
  padding: 0 20px 20px 0px;
  height: 80vh;
  display: block;
}

.lq-help-dialog .el-tabs__item {
  font-size: 12px !important;
  height: unset !important;
  padding: 10px !important;
}

.lq-help-dialog .el-tabs__nav {
  white-space: unset;
  width: 15vw !important;
  margin-left: 20px;
}


</style>
