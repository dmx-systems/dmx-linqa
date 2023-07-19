export default {

  computed: {

    logo () {
      // Note: "lang" parameter is here only for reactivity, the backend ignores it (it operates on lang cookie instead)
      return '/linqa/config/logo/png?multilingual=true&lang=' + this.lang
    },

    lang () {
      return this.$store.state.lang
    }
  }
}
