export default {
  methods: {
    cancel () {
      this.$store.dispatch('admin/setSecondaryPanel', undefined)
    }
  }
}
