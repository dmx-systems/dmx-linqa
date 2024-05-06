/**
 * The host component is expected to hold
 * - topic      any topic which has a "color" child value
 */
export default {

  mixins: [
    require('./color-model').default
  ],

  created () {
    this.$emit('action', {
      key: 'action.color',
      icon: 'el-icon-s-open',
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
