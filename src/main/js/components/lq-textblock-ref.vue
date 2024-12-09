<template>
  <div :class="['lq-textblock-ref', 'lq-comment-target-ref', {closable}]" v-if="topic" :style="style" @click="reveal">
    <span class="icon fa fa-fw fa-align-left secondary"></span>
    <lq-truncate class="textblock label" :html="textblockHtml"></lq-truncate>
    <el-button class="close-button" v-if="closable" type="primary" link icon="close" :title="resetTooltip"
      @click.stop="close"></el-button>
  </div>
</template>

<script>
import lq from '../lq-globals'

export default {

  mixins: [
    require('./mixins/color-model').default
  ],

  props: {
    topic: Object,          // the referred-to Textblock, optional (plain Object, not a dmx.Topic)
    closable: Boolean       // if true the close-button is rendered, optional
  },

  computed: {

    topicHtml () {
      return {
        lang1: this.html('lang1'),
        lang2: this.html('lang2')
      }
    },

    textblockHtml () {
      const topicHtml = this.topicHtml
      if (topicHtml.lang1 && topicHtml.lang2) {
        return topicHtml[lq.langSuffix(this.lang)]
      } else if (topicHtml.lang1) {
        return topicHtml.lang1
      } else if (topicHtml.lang2) {
        return topicHtml.lang2
      }
    },

    style () {
      return {
        'background-color': this.color
      }
    },

    lang () {
      return this.$store.state.lang
    },

    resetTooltip () {
      return lq.getString('tooltip.reset_filter')
    }
  },

  methods: {

    html (lang) {
      // Note: in a monolingual textblock "lang2" is not defined
      const html = this.topic.children['linqa.textblock_text#linqa.' + lang]?.value
      if (html !== '<p><br></p>') {
        return html
      }
    },

    reveal () {
      this.$store.dispatch('revealTextblock', this.topic)
    },

    close () {
      this.$store.dispatch('setTextblockFilter', undefined)
    }
  }
}
</script>

<style>
.lq-textblock-ref {
  display: inline-block;
  padding: 6px;
  cursor: pointer;
}

.lq-textblock-ref.closable .icon,
.lq-textblock-ref.closable .textblock {
  color: black !important;
}

.lq-textblock-ref .close-button {
  font-size: 18px;
  margin-left: 6px;
}

.lq-textblock-ref .close-button > i {
  vertical-align: text-bottom;
}
</style>
