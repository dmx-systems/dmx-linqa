/**
 * The host component is expected to hold
 * - "topic"     - any topic which is reactable
 * - "emojiMenu" - a reference of a <lq-emoji-menu> element
 */
export default {

  mixins: [
    require('./emoji-reaction').default
  ],

  created () {
    this.$emit('action', {
      key: 'action.emoji',
      icon: 'flag',
      handler: this.openEmojiMenu,
      enabledForUser: true
    })
  },

  methods: {
    openEmojiMenu () {
      this.$store.dispatch('select', [this.topic])      // programmatic selection
      this.$refs.emojiMenu.open()
    }
  },

  components: {
    'lq-emoji-menu': require('../lq-emoji-menu').default
  }
}
