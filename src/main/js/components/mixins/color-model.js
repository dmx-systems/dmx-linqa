import COLOR_PALETTE from '../../lq-color-palette'

/**
 * The host component is expected to hold
 * - topic      any topic which has a "color" child value
 */
export default {
  computed: {

    color: {
      get () {
        const c = this.topic.children['linqa.color']?.value
        // Note: we read "color" from child value, not view property.
        // See customizeTopic() in LinqaPlugin.java
        if (c) {
          return c
          // TODO: add default color config at canvas-level?
        } else if (this.topic.typeUri === 'linqa.line') {
          return COLOR_PALETTE.foreground[0]   // default is gray
        } else {
          return COLOR_PALETTE.background[1]   // default is light gray
        }
      },
      set (color) {
        // update client state
        this.topic.setViewProp('linqa.color', color)                    // for storage
        this.$set(this.topic.children, 'linqa.color', {value: color})   // for rendering
        // update server state
        this.$store.dispatch('updateColor', this.topic)
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
