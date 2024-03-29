<template>
  <div class="lq-note dmx-html-field info" v-if="infoMode" v-html="noteHtml" :style="{'background-color': color}"></div>
  <div :class="['lq-note', 'dmx-html-field', 'form']" v-else v-loading="saving">
    <template v-if="isNew">
      <div class="field">
        <div class="field-label"><lq-string>label.new_note</lq-string></div>
        <quill v-model="topic.value" :options="quillOptions" @quill-ready="focus" ref="quill"></quill>
      </div>
    </template>
    <template v-else>
      <div class="field">
        <div class="field-label"><lq-string>item.note</lq-string> ({{lang1}})</div>
        <quill v-model="model[lang1st].value" :options="quillOptions" @quill-ready="focus" ref="quill"></quill>
      </div>
      <div class="translate">
        <el-button type="text" icon="el-icon-bottom" :title="translateTooltip" @click="doTranslate"></el-button>
      </div>
      <div class="field">
        <div class="field-label"><lq-string>item.note</lq-string> ({{lang2}})</div>
        <quill v-model="model[lang2nd].value" :options="quillOptions" ref="translation" v-loading="translating"></quill>
        <div :class="['edited-indicator', {edited: editedFlag}]"><lq-string>label.translation_edited</lq-string></div>
      </div>
    </template>
    <lq-color-selector v-model="selectedColor"></lq-color-selector>
    <el-button class="save-button" type="primary" size="medium" @click="save">
      <lq-string>action.submit</lq-string>
    </el-button>
    <el-button size="medium" @click="doCancel">
      <lq-string>action.cancel</lq-string>
    </el-button>
  </div>
</template>

<script>
import dmx from 'dmx-api'
import lq from '../lq-globals'
import errorHandler from '../error-handler'

export default {

  mixins: [
    require('./mixins/mode').default,
    require('./mixins/translation').default,
    require('./mixins/highlight').default,
    require('./mixins/color-selector').default
  ],

  updated () {
    this.$store.dispatch('updateControlBox')
  },

  props: {

    topic: {                          // the Note topic to render (dmx.ViewTopic)
      type: dmx.ViewTopic,
      required: true
    },

    topicBuffer: dmx.ViewTopic,       // the edit buffer (dmx.ViewTopic)

    mode: {                           // 'info'/'form'
      type: String,
      default: 'info'
    }
  },

  data () {
    return {
      biTypeUri: 'linqa.note_text',   // URI of the bilingual child type
      saving: false                   // true while note is saved
    }
  },

  computed: {

    /**
     * This note's HTML (bilingual) as stored in DB.
     */
    note () {
      return {
        lang1: this.html('lang1'),
        lang2: this.html('lang2')
      }
    },

    /**
     * The language (URI suffix) to be rendered in info mode.
     */
    noteLang () {
      if (this.note.lang1 && this.note.lang2) {
        return lq.langSuffix(this.lang)
      } else if (this.note.lang1) {
        return 'lang1'
      } else if (this.note.lang2) {
        return 'lang2'
      }
    },

    /**
     * The HTML to be rendered in info mode.
     */
    noteHtml () {
      return this.highlight(this.topic, this.note[this.noteLang], true)
    },

    // TODO: factor out as a mixin? Copies in lq-heading.vue, lq-document.vue, lq-textblock.vue
    isNew () {
      return this.topic.id < 0
    },

    lang () {
      return this.$store.state.lang
    },

    quillOptions () {
      return lq.quillOptions
    }
  },

  methods: {

    focus () {
      this.$refs.quill.focus()
    },

    save () {
      this.saving = true
      this.topic.setViewProp('linqa.color', this.selectedColor)            // persistence
      this.topic.children['linqa.color'] = {value: this.selectedColor}     // view
      let action, arg, msgBox
      if (this.isNew) {
        action = 'createTopic'
        arg = {type: 'note', topic: this.topic}
        msgBox = 'confirm'
      } else {
        action = 'updateAndStoreColor'
        arg = this.topic
        // transfer edit buffer to topic model
        this.topic.children['linqa.translation_edited'] = {value: this.editedFlag}
        this.setNote('lang1')
        this.setNote('lang2')
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

    doTranslate () {
      this.translate().then(translation => {
        // Note: in case of translation error 'confirm' is passed (String)
        // TODO: why is this needed here, but not in lq-heading.vue or lq-document.vue?
        if (translation instanceof Object) {
          this.$refs.translation.setHTML(translation.text) // TODO: atm vue-quill-minimum does not react on model change
        }
      })
    },

    /**
     * @param   lang    URI suffix
     */
    html (lang) {
      // Note: in an untranslatable note "lang2" is not defined
      const html = this.topic.children['linqa.note_text#linqa.' + lang]?.value
      if (html !== '<p><br></p>') {
        return html
      }
    },

    /**
     * @param   lang    URI suffix
     */
    setNote (lang) {
      // Note: in an untranslatable note "lang2" is not defined     // TODO: simplify
      if (!this.topic.children['linqa.note_text#linqa.lang2']) {
        this.$set(this.topic.children, 'linqa.note_text#linqa.lang2', {})
      }
      //
      const compDefUri = 'linqa.note_text#linqa.' + lang
      this.topic.children[compDefUri].value = this.model[lang].value
    }
  },

  components: {
    'lq-color-selector': require('./lq-color-selector').default,
    quill: () => ({
      component: import('vue-quill-minimum' /* webpackChunkName: "vue-quill-minimum" */),
      loading: require('./lq-spinner')
    })
  }
}
</script>

<style>
.lq-note {
  padding: 12px;
}

.lq-note.form {
  background-color: var(--background-color);
}

.lq-note.form .translate {
  text-align: center;
  margin-top: 12px;
}

.lq-note.form .translate .el-button {
  font-size: 24px;
}

.lq-note.form .save-button {
  margin-top: var(--field-spacing);
}
</style>
