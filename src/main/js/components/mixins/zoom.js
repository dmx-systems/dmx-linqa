export default {

  computed: {

    buttonStyle () {
      return {
        'font-size': `${14 / this.zoom}px`      // "14" matches --primary-font-size (see App.vue)
      }
    },

    iconStyle () {
      return {
        'font-size': `${20 / this.zoom}px`      // icons need to be bigger than text
      }
    },

    zoom () {
      return this.$store.state.zoom
    }
  }
}
