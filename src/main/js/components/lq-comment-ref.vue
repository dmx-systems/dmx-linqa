<template>
  <div class="lq-comment-ref lq-comment-target-ref" v-if="comment" @click="click">
    <div class="creator label">{{displayName}}</div>
    <lq-truncate class="comment label" :html="commentHtml"></lq-truncate>
    <el-button class="close-button" v-if="closable" type="primary" link icon="close" @click.stop="remove"></el-button>
  </div>
</template>

<script>
import lq from '../lq-globals'

export default {

  props: {
    comment: Object,      // the referred-to Comment, optional (plain Object, not a dmx.Topic)
    closable: Boolean     // if true the close-button is rendered, optional
  },

  computed: {

    topicHtml () {
      return {
        lang1: this.html('lang1'),
        lang2: this.html('lang2')
      }
    },

    commentHtml () {
      const topicHtml = this.topicHtml
      if (topicHtml.lang1 && topicHtml.lang2) {
        return topicHtml[lq.langSuffix(this.lang)]
      } else if (topicHtml.lang1) {
        return topicHtml.lang1
      } else if (topicHtml.lang2) {
        return topicHtml.lang2
      }
    },

    creator () {
      return this.comment.children['dmx.accesscontrol.creator'].value
    },

    displayName () {
      return lq.getDisplayName(this.creator)
    },

    lang () {
      return this.$store.state.lang
    }
  },

  methods: {

    html (lang) {
      // Note: in a monolingual comment "lang2" is not defined
      const html = this.comment.children['linqa.comment_text#linqa.' + lang]?.value
      if (html !== '<p><br></p>') {
        return html
      }
    },

    click () {
      this.$emit('click', this.comment)
    },

    remove () {
      this.$emit('remove', this.comment)
    }
  }
}
</script>

<style>
.lq-comment-ref {
  display: inline-flex;
  position: relative;
  background-color: var(--primary-color-light);
  border-left: 5px solid var(--primary-color);
  padding: 6px 10px;
  cursor: pointer;
}

.lq-comment-ref .creator {
  font-weight: bold;
  margin-bottom: 2px;
}

.lq-comment-ref .comment {
  font-style: italic;
}

.lq-comment-ref .close-button {
  font-size: 18px;
  position: absolute;
  top: 1px;
  right: 1px;
}
</style>
