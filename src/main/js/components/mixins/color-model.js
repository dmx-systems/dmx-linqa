import COLOR_PALETTE from '../../lq-color-palette'

/**
 * The host component is expected to hold
 * - topic      any topic (dmx.Topic or dmx.ViewTopic) which can act as by-ID reference to a dmx.ViewTopic
 *              in the current topicmap. The "color" information is read from there.
 */
export default {
  computed: {

    color: {
      get () {
        try {
          const topicmap = this.$store.state.topicmap     // is undefined if not yet loaded
          const c = topicmap?.getTopic(this.topic.id).viewProps['linqa.color']
          if (c) {
            return c
          }
          // TODO: add default color config at canvas-level?
          if (this.topic.typeUri === 'linqa.line') {
            return COLOR_PALETTE.foreground[0]    // default is gray
          } else {
            return COLOR_PALETTE.background[1]    // default is light gray
          }
        } catch (e) {
          console.warn(`Color can't be determined: ${e.message}`)
          return 'red'
        }
      },
      set (color) {
        this.$store.dispatch('updateColor', {topic: this.topic, color})
      }
    },

    backgroundColor () {
      return {
        'background-color': this.color
      }
    },

    borderColor () {
      return {
        'border-color': this.color
      }
    },

    /**
     * Returns the color code in a form usable as a XML "id" attribute.
     */
    colorAsId () {
      return this.color.replace('#', '').replace('(', '-').replace(')', '').replace(/ /g, '')
    }
  }
}
