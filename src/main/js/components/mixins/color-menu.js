/**
 * The host component is expected to hold
 * - "topic"     - any topic which has a "color" child value
 * - "colorMenu" - a reference of a <lq-color-menu> element
 */
export default {

  mixins: [
    require('./color-model').default
  ],

  created () {
    this.$emit('action', {
      key: 'action.color',
      icon: 'BrushFilled',
      handler: this.openColorMenu
    })
  },

  methods: {
    openColorMenu () {
      this.$store.dispatch('select', [this.topic])      // programmatic selection
      this.$refs.colorMenu.open()
    }
  },

  components: {
    'lq-color-menu': require('../lq-color-menu').default
  }
}
