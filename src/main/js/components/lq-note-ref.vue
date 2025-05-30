<template>
  <div class="lq-note-ref lq-comment-target-ref" v-if="topic" :style="style" @click="reveal">
    <span class="icon fa fa-sticky-note secondary"></span>
    <lq-truncate class="note label" :html="noteHtml"></lq-truncate>
    <el-button class="close-button" v-if="closable" type="primary" link icon="close" :title="resetTooltip"
      @click.stop="close">
    </el-button>
  </div>
</template>

<script>
import lq from '../lq-globals'

export default {

  mixins: [
    require('./mixins/color-model').default
  ],

  props: {
    topic: Object,          // the referred-to Note, optional (plain Object, not a dmx.Topic)
    closable: Boolean       // if true the close-button is rendered, optional
  },

  computed: {

    topicHtml () {
      return {
        lang1: this.html('lang1'),
        lang2: this.html('lang2')
      }
    },

    noteHtml () {
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
      // Note: we read ref HTML from topicmap ViewTopic so when it changes the ref HTML changes as well
      const topic = this.$store.state.topicmap?.getTopic(this.topic.id)       // undefined if topicmap not yet loaded
      // in a monolingual note "lang2" is undefined
      const html = topic?.children['linqa.note_text#linqa.' + lang]?.value
      return html !== '<p><br></p>' && html
    },

    reveal () {
      this.$store.dispatch('revealTopicAndSetFilter', this.topic)
    },

    close () {
      this.$store.dispatch('setDiscussionFilter', undefined)
    }
  }
}
</script>

<style>
.lq-note-ref {
  display: inline-flex;
  padding: 6px;
  cursor: pointer;
}

.lq-note-ref .icon {
  margin-right: 6px;
}

.lq-note-ref .close-button {
  font-size: 18px;
  vertical-align: top !important;
  margin-left: 8px;
}
</style>
