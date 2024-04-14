import dmx from 'dmx-api'

/**
 * Note: the host component is expected to hold
 * - topic        any topic which has an "Original Language" field (dmx.ViewTopic)
 * - topicBuffer  the buffer used for topic editing (dmx.ViewTopic)
 * - biTypeUri    URI of the bilingual child type, e.g. 'linqa.note_text', "linqa.document_name"
 */
export default {

  mixins: [
    require('./mode').default
  ],

  updated () {
    this.$store.dispatch('updateControlBox')
  },

  props: {

    topic: {                  // the topic to render (dmx.ViewTopic)
      type: dmx.ViewTopic,
      required: true
    },

    mode: {                   // 'info'/'form'
      type: String,
      default: 'info'
    }
  },

  computed: {
    isNew () {
      return this.topic.id < 0
    }
  }
}
