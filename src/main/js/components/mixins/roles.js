export default {

  computed: {

    isLinqaAdmin () {
      return this.$store.state.isLinqaAdmin
    },

    isEditor () {
      return this.$store.state.isEditor
    },

    isAuthor () {
      return this.isLinqaAdmin || this.isEditor
    }
  }
}
