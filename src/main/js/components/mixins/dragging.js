export default {

  methods: {

    dragStart (dragMode) {
      this.$store.dispatch('dragStart', dragMode)
    },

    dragStop () {
      this.$store.dispatch('dragStop')
    }
  }
}
