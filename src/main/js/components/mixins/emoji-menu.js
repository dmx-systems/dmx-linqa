/**
 * The host component is expected to hold
 * - "topic"     - any topic which is reactable
 * - "emojiMenu" - a reference of a <lq-emoji-menu> element
 */
export default {

  created () {
    this.$emit('action', {
      key: 'action.emoji',
      icon: 'el-icon-chat-round',
      handler: this.openEmojiMenu
    })
  },

  methods: {

    openEmojiMenu () {
      this.$store.dispatch('select', [this.topic])      // programmatic selection
      this.$refs.emojiMenu.open()
    },

    selectEmoji (emoji) {
      this.$store.dispatch('reactWithEmoji', {topic: this.topic, emoji})
    }
  },

  components: {
    'lq-emoji-menu': require('../lq-emoji-menu').default
  }
}
