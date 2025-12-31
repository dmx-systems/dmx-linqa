<template>
  <div :class="['lq-comment', mode]" :data-id="topic.id" v-loading="saving">
    <!-- Heading -->
    <div class="heading">
      <div>
        <small class="creator" :title="emailAddress">{{displayName}}</small>
        <small class="date label">{{date}}</small>
        <small :class="['translation-info', 'label', translationMode]">
          (<lq-string>label.translation</lq-string>: {{translationInfo}})
        </small>
      </div>
      <div class="button-panel" v-if="buttonPanelVisibility">
        <el-button class="fa fa-reply" type="primary" link :title="replyTooltip" @click="reply"></el-button>
        <el-dropdown v-if="commentIsWritable" trigger="click" @command="handle">
          <el-button type="primary" link class="fa fa-fw fa-ellipsis-v"></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="edit"><lq-string>action.edit</lq-string></el-dropdown-item>
              <el-dropdown-item command="deleteComment" divided><lq-string>action.delete</lq-string></el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>
    <!-- Refs -->
    <lq-comment-ref :comment="refComment" @click="commentRefClick"></lq-comment-ref>
    <lq-document-ref :document="refDocument"></lq-document-ref>
    <lq-note-ref :topic="refNote"></lq-note-ref>
    <lq-textblock-ref :topic="refTextblock"></lq-textblock-ref>
    <!-- Content -->
    <div class="columns">
      <template v-if="infoMode">
        <div class="dmx-html-field info text1" v-html="comment[lang1st]"></div>
        <div class="dmx-html-field info text2" v-html="comment[lang2nd]"></div>
      </template>
      <template v-else>
        <div class="dmx-html-field text1">
          <quill v-model="model[lang1st].value" :options="quillOptions" @quill-ready="focus" ref="quill">
          </quill>
        </div>
        <el-button class="translate-button" type="primary" link icon="right" :title="translateTooltip"
          @click="doTranslate">
        </el-button>
        <div class="dmx-html-field text2">
          <quill v-model="model[lang2nd].value" :options="quillOptions" ref="translation" v-loading="translating">
          </quill>
        </div>
      </template>
    </div>
    <!-- Attachments -->
    <div class="attachments">
      <lq-attachment v-for="file in attachments" :file="file" :enabled="true" :key="file.id"></lq-attachment>
    </div>
    <template v-if="formMode">
      <el-button class="save-button" type="primary" @click="save">
        <lq-string>action.submit</lq-string>
      </el-button>
      <el-button @click="cancel">
        <lq-string>action.cancel</lq-string>
      </el-button>
    </template>
  </div>
</template>

<script>
import lq from '../lq-globals'

export default {

  mixins: [
    require('./mixins/mode').default,
    require('./mixins/translation').default
  ],

  props: {
    topic: {                    // the Comment topic to render (plain Object, not a dmx.Topic ### FIXDOC?)
      type: Object,
      required: true
    }
  },

  data () {
    return {
      biTypeUri: 'linqa.comment_text',    // URI of the bilingual child type
      mode: 'info',                       // 'info'/'form'
      topicBuffer: undefined,             // the edit buffer (dmx.Topic)
      saving: false                       // true while comment is saved
    }
  },

  computed: {

    /**
     * This comment's HTML (bilingual) as stored in DB.
     */
    comment () {
      return {
        // Note: in an untranslatable comment "lang2" is not defined.
        lang1: this.topic.children['linqa.comment_text#linqa.lang1']?.value,
        lang2: this.topic.children['linqa.comment_text#linqa.lang2']?.value
      }
    },

    buttonPanelVisibility () {
      return this.infoMode && this.isWritable
    },

    refComment () {
      return this.topic.children['linqa.comment']
    },

    refDocument () {
      return this.topic.children['linqa.document']
    },

    refNote () {
      return this.topic.children['linqa.note']
    },

    refTextblock () {
      return this.topic.children['linqa.textblock']
    },

    attachments () {
      return this.topic.children['dmx.files.file#linqa.attachment']
    },

    username () {
      return this.$store.state.username
    },

    isLinqaAdmin () {
      return this.$store.state.isLinqaAdmin
    },

    isEditor () {
      return this.$store.state.isEditor
    },

    isWritable () {
      return this.$store.state.isWritable
    },

    commentIsWritable () {
      return this.isWritable && (this.username === this.creator || this.isLinqaAdmin)
    },

    created () {
      return this.topic.children['dmx.timestamps.created'].value
    },

    creator () {
      return this.topic.children['dmx.accesscontrol.creator'].value
    },

    displayName () {
      return lq.getDisplayName(this.creator)
    },

    emailAddress () {
      return lq.getShowEmailAddress(this.creator) && this.creator
    },

    date () {
      return new Date(this.created).toLocaleString()
    },

    translationMode () {
      if (this.infoMode) {
        const topic = this.topic.children['linqa.comment_text#linqa.' + this.lang2nd]
        if (!topic || topic.value === '<p><br></p>') {
          return 'none'
        } else {
          return this.translationEdited ? 'edited' : 'automatic'
        }
      } else {
        const buffer = this.model[this.lang2nd].value
        if (!buffer || buffer === '<p><br></p>') {
          return 'none'
        } else {
          return this.editedFlag ? 'edited' : 'automatic'
        }
      }
    },

    translationInfo () {
      return lq.getString('label.' + this.translationMode)
    },

    quillOptions () {
      return lq.quillOptions2
    },

    replyTooltip () {
      return lq.getString('tooltip.reply')
    }
  },

  methods: {

    focus () {
      this.$refs.quill.focus()
    },

    save () {
      this.saving = true
      // transfer edit buffer to topic model
      this.topic.children['linqa.translation_edited'] = {value: this.editedFlag}
      this.topic.children['linqa.comment_text#linqa.lang1'] = this.model.lang1
      this.topic.children['linqa.comment_text#linqa.lang2'] = this.model.lang2
      this.$store.dispatch('updateComment', this.topic).then(() => {
        this.mode = 'info'
        this.saving = false
      })
    },

    cancel () {
      this.mode = 'info'
    },

    reply () {
      this.$emit('reply', this.topic)
    },

    handle (command) {
      this[command]()
    },

    edit () {
      this.mode = 'form'
      this.topicBuffer = this.topic.clone()
      // Note 1: in an untranslatable comment "lang2" is not defined. We need it as editor model.
      // Note 2: we can't use newFormModel() as Comment is a recursive type definition.
      if (!this.topicBuffer.children['linqa.comment_text#linqa.lang2']) {
        this.topicBuffer.children['linqa.comment_text#linqa.lang2'] = {value: ''}
      }
      this.$nextTick(() => {
        this.$store.dispatch('jumpToComment', {
          comment: this.topic,
          behavior: lq.isChrome ? 'auto' : undefined,
          glow: false
        })
      })
    },

    doTranslate () {
      this.translate().then(translation => {
        // Note: in case of translation error 'confirm' is passed (String)
        if (translation instanceof Object) {
          this.$refs.translation.setHTML(translation.text) // TODO: atm vue-quill-minimum does not react on model change
        }
      })
    },

    // Note: can't be named "delete"
    deleteComment () {
      this.$store.dispatch('deleteComment', this.topic)
    },

    commentRefClick (comment) {
      this.$emit('comment-ref-click', comment)
    }
  }
}
</script>

<style>

.lq-comment {
  background-color: white;
  padding: 12px;
  border-radius: 10px;
  margin:0 10px;
}

.lq-comment .heading {
  display: flex;
  margin-bottom: 10px;
  color: var(--secondary-color);
}

.lq-comment .heading > div:first-child {
  flex-grow: 1;
}

.lq-comment .heading .creator {
  font-size: var(--secondary-font-size);
  font-weight: bold;
}

.lq-comment .heading .date,
.lq-comment .heading .translation-info {
  margin-left: 12px;
}

.lq-comment.form .heading .translation-info.edited {
  background-color: var(--primary-color-light);
}

.lq-comment .heading .button-panel {
  visibility: hidden;
}

.lq-comment:hover .heading .button-panel {
  visibility: visible;
}

.lq-comment .heading .button-panel .el-dropdown {
  margin-left: 6px;
}

.lq-comment .lq-comment-target-ref {
  margin-bottom: 15px;
}

.lq-comment .lq-attachment {
  margin-top: 6px;
}

.lq-comment .lq-attachment:first-child,
.lq-comment .save-button {
  margin-top: 15px;
}

.lq-comment .columns {
  display: flex;
}

.lq-comment .columns > div {
  flex-basis: 50%;
}

.lq-comment .columns > .text1 {
  border-right: 1px dashed #aaa;
}

.lq-comment.form .columns > .text2 {
  border-left: 1px dashed #aaa;
}

.lq-comment.info .columns > .text1 {
  padding-right: 15px;
}

.lq-comment.info .columns > .text2 {
  padding-left: 15px;
}

.lq-comment .columns > .text1 .ql-editor {
  padding: 0 var(--emoji-button-padding) 0 0 !important;
}

.lq-comment .columns > .text2 .ql-editor {
  padding: 0 var(--emoji-button-padding) 0 15px !important;
}

.lq-comment .columns > .translate-button {
  font-size: 18px;
  margin: 0 6px;
}

.lq-comment .columns.glow {
  animation: glow var(--glow-duration);
}

@keyframes glow {
  0% {
    background-color: var(--highligth-glow);
  },
  100% {
    background-color: white;
  }
}
</style>
