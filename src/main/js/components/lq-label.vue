<template>
  <div v-if="infoMode" class="lq-label info" v-html="labelText"></div>
  <div v-else :class="['lq-label', 'form']" v-loading="saving">
    <template v-if="isNew">
      <div class="field-label"><lq-string>label.new_label</lq-string></div>
      <el-input v-model="topic.value" ref="input"></el-input>
    </template>
    <template v-else>
      <div class="field">
        <div class="field-label"><lq-string>item.label</lq-string> ({{lang1}})</div>
        <el-input v-model="model[lang1st].value" ref="input"></el-input>
      </div>
      <div class="translate">
        <el-button type="text" icon="el-icon-bottom" :title="translateTooltip" @click="translate"></el-button>
      </div>
      <div class="field">
        <div class="field-label"><lq-string>item.label</lq-string> ({{lang2}})</div>
        <el-input v-model="model[lang2nd].value" v-loading="translating"></el-input>
        <div :class="['edited-indicator', {edited: editedFlag}]"><lq-string>label.translation_edited</lq-string></div>
      </div>
    </template>
    <el-button class="save-button" type="primary" size="medium" @click="save">
      <lq-string>action.submit</lq-string>
    </el-button>
    <el-button size="medium" @click="cancel">
      <lq-string>action.cancel</lq-string>
    </el-button>
  </div>
</template>

<script>
import dmx from 'dmx-api'
import zw from '../lq-globals'

export default {

  mixins: [
    require('./mixins/mode').default,
    require('./mixins/translation').default,
    require('./mixins/highlight').default,
    require('./mixins/cancel').default
  ],

  mounted () {
    if (this.formMode) {
      this.$refs.input.focus()      // FIXME
    }
  },

  updated () {
    this.$store.dispatch('updateControlBox')
  },

  props: {

    topic: {                        // the Label topic to render (dmx.ViewTopic)
      type: dmx.ViewTopic,
      required: true
    },

    topicBuffer: dmx.ViewTopic,     // the edit buffer (dmx.ViewTopic)

    mode: {                         // 'info'/'form'
      type: String,
      default: 'info'
    }
  },

  data () {
    return {
      type: 'linqa.label',
      saving: false                 // true while label is saved
    }
  },

  computed: {

    /**
     * This label's text (bilingual) as stored in DB.
     */
    label () {
      return {
        // Note: in an untranslatable label "lang2" is not defined
        lang1: this.topic.children['linqa.label.lang1']?.value,
        lang2: this.topic.children['linqa.label.lang2']?.value
      }
    },

    /**
     * The language (URI suffix) to be rendered in info mode.
     */
    labelLang () {
      if (this.label.lang1 && this.label.lang2) {
        return zw.langSuffix(this.lang)
      } else if (this.label.lang1) {
        return 'lang1'
      } else if (this.label.lang2) {
        return 'lang2'
      }
    },

    /**
     * The text to be rendered in info mode.
     */
    labelText () {
      return this.highlight(this.topic, this.label[this.labelLang])
    },

    // TODO: factor out as a mixin? Copies in lq-note.vue, lq-document.vue, lq-textblock.vue
    isNew () {
      return this.topic.id < 0
    },

    lang () {
      return this.$store.state.lang
    }
  },

  methods: {

    save () {
      this.saving = true
      let action, arg, msgBox
      if (this.isNew) {
        action = 'createTopic'
        arg = {
          type: 'label',
          topic: this.topic
        }
        msgBox = 'confirm'
      } else {
        action = 'update'
        arg = this.topic
        // transfer edit buffer to topic model
        this.topic.children['linqa.translation_edited'] = {value: this.editedFlag}
        this.setText('lang1')
        this.setText('lang2')
      }
      this.$store.dispatch(action, arg).catch(error => {
        return this.handleError(error, msgBox)
      }).then(result => {
        if (result === 'confirm') {
          arg.monolingual = true
          this.$store.dispatch(action, arg).catch(error => {
            errorHandler(error)     // generic error handler
          })
        }
      }).catch(result => {
        // console.log('cancel', result)
      }).finally(() => {
        this.saving = false
      })
    },

    /**
     * @param   lang    URI suffix
     */
    setText (lang) {
      // Note: in an untranslatable label "lang2" is not defined     // TODO: simplify
      if (!this.topic.children['linqa.label.lang2']) {
        this.$set(this.topic.children, 'linqa.label.lang2', {})
      }
      //
      const compDefUri = 'linqa.label.' + lang
      this.topic.children[compDefUri].value = this.model[lang].value
    }
  }
}
</script>

<style>
.lq-label.info {
  font-size: 32px;
  font-weight: bold;
}

.lq-label.form {
  background-color: var(--background-color);
  padding: 10px;
}

.lq-label.form .translate {
  text-align: center;
  margin-top: 12px;
}

.lq-label.form .translate .el-button {
  font-size: 24px;
}

.lq-label.form .save-button {
  margin-top: var(--field-spacing);
}
</style>
