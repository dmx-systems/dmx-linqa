export default {

  mixins: [
    require('./screen').default
  ],

  computed: {
    lang () {
      return this.$store.state.lang
    }
  },

  methods: {
    logo (responsive) {
      if (responsive && this.isSmallScreen) {
        return '/linqa/config/logo-small/png'
      } else {
        // Note: "lang" parameter is here only for reactivity, backend ignores it and operates on lang cookie instead
        return '/linqa/config/logo/png?multilingual=true&lang=' + this.lang
      }
    }
  }
}
