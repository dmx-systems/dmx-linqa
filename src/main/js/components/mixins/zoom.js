export default {

  computed: {

    // zoom compensation
    buttonStyle () {
      return {
        'font-size': `${14 / this.zoom}px`      // "14" matches --primary-font-size (see App.vue)
      }
    },

    // zoom compensation
    iconStyle () {
      return {
        'font-size': `${20 / this.zoom}px`      // icons need to be bigger than text    // TODO 18px, 24px for mobile
      }
    },

    zoom () {
      return this.$store.state.zoom
    }
  }
}
