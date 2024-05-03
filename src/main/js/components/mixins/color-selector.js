/**
 * TODO: drop it. Color is no longer "cancelable".
 *
 * This mixin is used by canvas items which feature a color selector.
 * It provides:
 * - color          the persisted color (as read from DB)
 * - selectedColor  the model for the color selector, initialized with "color"
 * - cancelColor    a method to reset the color selector and leave form mode
 * Note: "color" and "selectedColor" may differ as long as the canvas item is not saved.
 *
 * The host component (a canvas item) is expected to hold
 * - topic          any topic which has a "color" view property
 */
export default {

  mixins: [
    require('./color').default,
    require('./cancel').default
  ],

  created () {
    // console.log('color', this.color)
    this.selectedColor = this.color
  },

  data () {
    return {
      selectedColor: undefined        // color selector model
    }
  },

  methods: {
    cancelColor () {
      this.selectedColor = this.color
      this.cancel()
    }
  }
}
