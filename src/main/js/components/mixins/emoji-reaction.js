/**
 * The host component is expected to hold
 * - "topic" - any topic which is reactable
 */
export default {
  methods: {
    reactWithEmoji (emoji) {
      this.$store.dispatch('reactWithEmoji', {topic: this.topic, emoji})
    }
  }
}
