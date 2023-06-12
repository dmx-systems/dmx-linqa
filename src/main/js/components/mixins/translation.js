import zw from '../../lq-globals'

/**
 * Note: the host component is expected to hold
 * - topic        any topic which has an "Original Language" field (dmx.ViewTopic)
 * - type         base URI of topic's type, e.g. 'linqa.note'
 * - topicBuffer  the buffer used for topic editing (dmx.ViewTopic)
 */
export default {

  mixins: [
    require('./error-handling').default
  ],

  data () {
    return {
      translation: '',        // last translation result
      translating: false      // true while translation is in progress
    }
  },

  computed: {

    model () {
      return {
        lang1: this.topicBuffer.children[`${this.type}.lang1`],
        lang2: this.topicBuffer.children[`${this.type}.lang2`]
      }
    },

    /**
     * Language (ISO 639-1 language code) to be rendered first (top/left), basically the topic's original language.
     * For an untranslatable topic falls back to 'dmx.linqa.lang1' configuration.
     */
    lang1 () {
      return this.$store.state[this.lang1st]
    },

    /**
     * Language (ISO 639-1 language code) to be rendered second (bottom/right), basically the topic's translation
     * language. For an untranslatable topic falls back to 'dmx.linqa.lang2' configuration.
     */
    lang2 () {
      return this.$store.state[this.lang2nd]
    },

    /**
     * Language (URI suffix) to be rendered first (top/left), basically the topic's original language.
     * For an untranslatable topic falls back to 'lang1'.
     */
    lang1st () {
      return this.origLang || 'lang1'
    },

    /**
     * Language (URI suffix) to be rendered second (bottom/right), basically the topic's translation language.
     * For an untranslatable topic falls back to 'lang2'.
     */
    lang2nd () {
      return this.translatedLang || 'lang2'
    },

    /**
     * The topic's "edited" flag as stored in DB.
     */
    translationEdited () {
      return this.topic.children['linqa.translation_edited']?.value
    },

    /**
     * The topic's "edited" flag computed dynamically while typing.
     */
    editedFlag () {
      const uri = `${this.type}.${this.lang2nd}`            // the "edited" flag always relates to translation (lang2nd)
      const buffer = this.model[this.lang2nd].value
      if (!buffer || buffer === '<p><br></p>') {
        return false                                        // regard empty buffer as non-edited
      } else if (this.translation) {
        return buffer !== this.translation                  // compare buffer to last translation, if known
      } else if (this.translationEdited) {
        return true                                         // stay "dirty" if we're dirty already
      } else if (this.topic.children[uri]) {
        return buffer !== this.topic.children[uri].value    // compare buffer to stored value, if exists
      } else {
        return true
      }
    },

    /**
     * The topic's original language (URI suffix) as stored in DB, or undefined for a topic which could not be
     * translated (resp. is not translated yet, the latter happens for "Document").
     */
    origLang () {
      // Note 1: an untranslatable topic has no "Original Language".
      // Note 2: only for Documents newFormModel() is called at creation time (see newDocumentViewTopic() in
      // lq-canvas.vue). In this case "Original Language" exists but has empty value. In contrast for the other content
      // objects (Notes, Textblocks etc.) newFormModel() is only called when editing (see edit() in lq-canvas-item.vue).
      const lang = this.topic.children['linqa.language#linqa.original_language']?.value
      if (lang) {
        return zw.langSuffix(lang)
      }
    },

    /**
     * The topic's translation language (URI suffix), or undefined for an untranslatable topic.
     */
    translatedLang () {
      if (this.origLang === 'lang1') {
        return 'lang2'
      } else if (this.origLang === 'lang2') {
        return 'lang1'
      }
    },

    translateTooltip () {
      return zw.getString('tooltip.translate')
    }
  },

  methods: {
    translate () {
      // TODO: send target lang if known
      this.translating = true
      return this.$store.dispatch('translate', this.model[this.lang1st].value).then(translation => {
        // TODO: process detected lang
        this.model[this.lang2nd].value = translation.text
        this.translation = translation.text
        return translation
      }).catch(error => {
        return this.handleError(error, 'alert')
      }).finally(() => {
        this.translating = false
      })
    }
  }
}
