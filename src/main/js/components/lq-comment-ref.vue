<template>
  <div class="lq-comment-ref lq-comment-target-ref" v-if="comment" @click="click">
    <div class="creator label">{{displayName}}</div>
    <lq-truncate class="comment label" :html="html[lang]"></lq-truncate>
    <el-button class="close-button" v-if="closable" type="text" icon="el-icon-close" @click.stop="remove"></el-button>
  </div>
</template>

<script>
import zw from '../lq-globals'

export default {

  props: {
    comment: Object,      // the referred-to Comment, optional (plain Object, not a dmx.Topic)
    closable: Boolean     // if true the close-button is rendered, optional
  },

  computed: {

    html () {
      return {
        lang1: this.comment.children['linqa.comment.lang1'].value,
        lang2: this.comment.children['linqa.comment.lang2'].value      // FIXME: empty case, monolingual case
      }
    },

    creator () {
      return this.comment.children['dmx.accesscontrol.creator'].value
    },

    displayName () {
      return zw.getDisplayName(this.creator)
    },

    lang () {
      return this.$store.state.lang
    }
  },

  methods: {

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
  display: inline-block;
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
