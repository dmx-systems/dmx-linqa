import COLOR_PALETTE from '../../lq-color-palette'

/**
 * The host component is expected to hold
 * - topic      any topic which has a "color" child value
 */
export default {
  computed: {

    color: {
      get () {
        // Note: we read "color" from child value, not view property.
        // See customizeTopic() in LinqaPlugin.java
        const c = this.topic.children['linqa.color']?.value
        if (c) {
          return c
        }
        // TODO: add default color config at canvas-level?
        if (this.topic.typeUri === 'linqa.line') {
          return COLOR_PALETTE.foreground[0]    // default is gray
        } else {
          return COLOR_PALETTE.background[1]    // default is light gray
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
