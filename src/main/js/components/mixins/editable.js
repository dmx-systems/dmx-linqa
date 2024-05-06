import dmx from 'dmx-api'

/**
 * Used by canvas items which have info/form mode.
 */
export default {

  mixins: [
    require('./mode').default
  ],

  updated () {
    this.$store.dispatch('updateControlBox')
  },

  props: {

    topic: {                  // the topic to render
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
  },

  methods: {
    cancel () {
      this.$store.dispatch('cancel', this.topic)
    }
  }
}
