<template>
  <div v-if="infoMode" class="lq-heading info" v-html="headingText"></div>
  <div v-else :class="['lq-heading', 'form']" v-loading="saving">
    <template v-if="isNew">
      <div class="field-label"><lq-string>label.new_label</lq-string></div>
      <el-input v-model="topic.value" ref="input"></el-input>
    </template>
    <template v-else>
      <div class="field">
        <div class="field-label"><lq-string>item.heading</lq-string> ({{lang1}})</div>
        <el-input v-model="model[lang1st].value" ref="input"></el-input>
      </div>
      <div class="translate">
        <el-button type="text" icon="el-icon-bottom" :title="translateTooltip" @click="translate"></el-button>
      </div>
      <div class="field">
        <div class="field-label"><lq-string>item.heading</lq-string> ({{lang2}})</div>
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
import lq from '../lq-globals'

export default {

  mixins: [
    require('./mixins/editable').default,
    require('./mixins/translation').default,
    require('./mixins/highlight').default
  ],

  mounted () {
    if (this.formMode) {
      this.$refs.input.focus()            // FIXME: focus does not work in update form
    }
  },

  props: {
    topicBuffer: dmx.ViewTopic,           // the edit buffer (dmx.ViewTopic)
  },

  data () {
    return {
      biTypeUri: 'linqa.heading_text',    // URI of the bilingual child type
      saving: false                       // true while heading is saved
    }
  },

  computed: {

    /**
     * This heading's text (bilingual) as stored in DB.
     */
    heading () {
      return {
        // Note: in an untranslatable heading "lang2" is not defined
        lang1: this.topic.children['linqa.heading_text#linqa.lang1']?.value,
        lang2: this.topic.children['linqa.heading_text#linqa.lang2']?.value
      }
    },

    /**
     * The language (URI suffix) to be rendered in info mode.
     */
    headingLang () {
      if (this.heading.lang1 && this.heading.lang2) {
        return lq.langSuffix(this.lang)
      } else if (this.heading.lang1) {
        return 'lang1'
      } else if (this.heading.lang2) {
        return 'lang2'
      }
    },

    /**
     * The text to be rendered in info mode.
     */
    headingText () {
      return this.highlight(this.topic, this.heading[this.headingLang])
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
          type: 'heading',
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
      // Note: in an untranslatable heading "lang2" is not defined     // TODO: simplify
      if (!this.topic.children['linqa.heading_text#linqa.lang2']) {
        this.topic.children['linqa.heading_text#linqa.lang2'] = {}
      }
      //
      const compDefUri = 'linqa.heading_text#linqa.' + lang
      this.topic.children[compDefUri].value = this.model[lang].value
    }
  }
}
</script>

<style>
.lq-heading.info {
  font-size: 32px;
  font-weight: bold;
}

.lq-heading.form {
  background-color: var(--background-color);
  padding: 10px;
}

.lq-heading.form .translate {
  text-align: center;
  margin-top: 12px;
}

.lq-heading.form .translate .el-button {
  font-size: 24px;
}

.lq-heading.form .save-button {
  margin-top: var(--field-spacing);
}
</style>
