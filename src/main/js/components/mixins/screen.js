export default {
  computed: {

    isSmallScreen () {
      return this.$store.state.isSmallScreen
    },

    isBigScreen () {
      return !this.isSmallScreen
    }
  }
}
