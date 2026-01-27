export default {

  computed: {
    dragMode () {
      return this.$store.state.dragMode
    }
  },

  methods: {

    dragStart (dragMode) {
      this.$store.dispatch('dragStart', dragMode)
    },

    dragStop () {
      this.$store.dispatch('dragStop')
    }
  }
}
