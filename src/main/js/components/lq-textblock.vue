<template>
  <div :class="['lq-textblock', 'dmx-html-field', {'filter': isFiltered}, mode]" v-loading="saving" :style="style">
    <template v-if="infoMode">
      <div class="texts">
        <div class="text" v-html="textblock[lang1st]"></div>
        <div class="text" v-html="textblock[lang2nd]"></div>
      </div>
      <div class="discussion-button" :style="style">
        <el-button type="text" icon="el-icon-chat-round" @click="setFilter" :title="discussTooltip"></el-button>
      </div>
    </template>
    <template v-else>
      <template v-if="isNew">
        <div class="field">
          <div class="field-label"><lq-string>label.new_textblock</lq-string></div>
          <quill v-model="topic.value" :options="quillOptions" @quill-ready="focus" ref="quill"></quill>
        </div>
      </template>
      <template v-else>
        <div class="field texts">
          <div class="text">
            <div class="field-label"><lq-string>item.textblock</lq-string> ({{lang1}})</div>
            <quill v-model="model[lang1st].value" :options="quillOptions" @quill-ready="focus" ref="quill"></quill>
          </div>
          <el-button class="translate" type="text" icon="el-icon-right" :title="translateTooltip" @click="doTranslate">
          </el-button>
          <div class="text">
            <div class="field-label"><lq-string>item.textblock</lq-string> ({{lang2}})</div>
            <quill v-model="model[lang2nd].value" :options="quillOptions" ref="translation" v-loading="translating">
            </quill>
            <div :class="['edited-indicator', {edited: editedFlag}]">
              <lq-string>label.translation_edited</lq-string>
            </div>
          </div>
        </div>
      </template>
      <lq-color-selector v-model="selectedColor"></lq-color-selector>
      <el-button class="save-button" type="primary" size="medium" @click="save">
        <lq-string>action.submit</lq-string>
      </el-button>
      <el-button size="medium" @click="cancelColor">
        <lq-string>action.cancel</lq-string>
      </el-button>
    </template>
  </div>
</template>

<script>
import dmx from 'dmx-api'
import lq from '../lq-globals'
import errorHandler from '../error-handler'

export default {

  mixins: [
    require('./mixins/editable').default,
    require('./mixins/translation').default,
    require('./mixins/highlight').default,
    require('./mixins/color-selector').default
  ],

  props: {
    topicBuffer: dmx.ViewTopic,       // the edit buffer (dmx.ViewTopic)
  },

  data () {
    return {
      biTypeUri: 'linqa.textblock_text',  // URI of the bilingual child type
      saving: false                       // true while textblock is saved
    }
  },

  computed: {

    /**
     * This textblock's HTML (bilingual) as stored in DB.
     */
    textblock () {
      return {
        lang1: this.highlight(this.topic, this.html('lang1'), true),
        lang2: this.highlight(this.topic, this.html('lang2'), true)
      }
    },

    style () {
      if (this.infoMode) {
        return {
          'background-color': this.color
        }
      }
    },

    isFiltered () {
      return this.textblockFilter?.id === this.topic.id
    },

    textblockFilter () {
      return this.$store.state.textblockFilter
    },

    quillOptions () {
      return lq.quillOptions
    },

    discussTooltip () {
      return lq.getString('tooltip.discuss')
    }
  },

  methods: {

    focus () {
      this.$refs.quill.focus()
    },

    setFilter () {
      this.$store.dispatch('setTextblockFilter', this.topic)
    },

    save () {
      this.saving = true
      this.topic.setViewProp('linqa.color', this.selectedColor)            // for storage
      this.topic.children['linqa.color'] = {value: this.selectedColor}     // for rendering
      let action, arg, msgBox
      if (this.isNew) {
        action = 'createTopic'
        arg = {type: 'textblock', topic: this.topic}
        msgBox = 'confirm'
      } else {
        action = 'updateAndStoreColor'
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
      // Note: in an untranslatable textblock "lang2" is not defined
      const html = this.topic.children['linqa.textblock_text#linqa.' + lang]?.value
      if (html !== '<p><br></p>') {
        return html
      }
    },

    /**
     * @param   lang    URI suffix
     */
    setText (lang) {
      // Note: in an untranslatable textblock "lang2" is not defined     // TODO: simplify
      if (!this.topic.children['linqa.textblock_text#linqa.lang2']) {
        this.$set(this.topic.children, 'linqa.textblock_text#linqa.lang2', {})
      }
      //
      const compDefUri = 'linqa.textblock_text#linqa.' + lang
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
.lq-textblock {
  padding: 6px;
  border: var(--filter-border);
}

.lq-textblock.filter {
  border-color: var(--primary-color);
}

.lq-textblock.filter .discussion-button {
  border-color: var(--primary-color);
}

.lq-textblock .texts {
  display: flex;
}

.lq-textblock .texts .text {
  flex-basis: 50%;
}

.lq-textblock.info .texts .text:nth-child(1) {
  padding-right: 20px;
  border-right: 2px dashed #f6f6f6;
}

.lq-textblock.info .texts .text:nth-child(2) {
  padding-left: 20px;
}

.lq-textblock.form {
  background-color: var(--background-color);
}

.lq-textblock.form .texts {
  align-items: flex-start;
}

.lq-textblock.form .el-button.translate {
  align-self: center;
  font-size: 24px;
  margin: 0 8px;
}

.lq-textblock.form .save-button {
  margin-top: var(--field-spacing);
}

/* discussion button */

.lq-textblock .discussion-button {
  position: absolute;
  top: 0;
  right: -34px;
  padding: 2px 2px 2px 12px;
  border-top-right-radius: 19px;
  border-bottom-right-radius: 19px;
  border-top: var(--filter-border);
  border-right: var(--filter-border);
  border-bottom: var(--filter-border);
}

.lq-textblock .discussion-button .el-button {
  font-size: 18px;
}
</style>
