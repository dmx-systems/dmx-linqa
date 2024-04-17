import dmx from 'dmx-api'

/**
 * This mixin is used by editable canvas items which can be swithed between info/form mode.
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
  }
}
