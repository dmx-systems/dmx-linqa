export default {

  computed: {

    logo () {
      if (this.isSmallScreen) {
        return '/linqa/config/logo-small/png'
      } else {
        // Note: "lang" parameter is here only for reactivity, backend ignores it and operates on lang cookie instead
        return '/linqa/config/logo/png?multilingual=true&lang=' + this.lang
      }
    },

    isSmallScreen () {
      return this.$store.state.isSmallScreen
    },

    lang () {
      return this.$store.state.lang
    }
  }
}
