export default {

  computed: {

    isAuthor () {
      return this.isLinqaAdmin || this.isEditor
    },

    isLinqaAdmin () {
      return this.$store.state.isLinqaAdmin
    },

    isEditor () {
      return this.$store.state.isEditor
    }
  }
}
