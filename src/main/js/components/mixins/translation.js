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

    // lang to be rendered in left column
    lang1 () {
      return this.origLang || 'lang1'
    },

    // lang to be rendered in right column
    lang2 () {
      return this.translatedLang || 'lang2'
    },

    // persisted "edited" flag
    translationEdited () {
      return this.topic.children['linqa.translation_edited']?.value
    },

    // new "edited" flag (computed dynamically while typing)
    editedFlag () {
      const uri = `${this.type}.${this.lang2}`
      const buffer = this.model[this.lang2].value
      if (!buffer || buffer === '<p><br></p>') {
        return false                                          // regard empty buffer as non-edited
      } else if (this.translation) {
        return buffer !== this.translation                    // compare buffer to last translation, if known
      } else if (this.translationEdited) {
        return true                                           // stay "dirty" if we're dirty already
      } else if (this.topic.children[uri]) {
        return buffer !== this.topic.children[uri].value      // compare buffer to stored value, if exists
      } else {
        return true
      }
    },

    origLang () {
      // Note: a monolingual topic has no "Original Language", "origLang" is undefined then
      return this.topic.children['linqa.language#linqa.original_language']?.value
    },

    // Note: for a monolingual topic "translatedLang" is undefined
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
      return this.$store.dispatch('translate', this.model[this.lang1].value).then(translation => {
        // TODO: process detected lang
        this.model[this.lang2].value = translation.text
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
