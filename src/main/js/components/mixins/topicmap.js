import lq from '../../lq-globals'

export default {
  computed: {

    topicmap () {
      return this.$store.state.topicmap
    },

    topics () {
      return this.topicmap?.topics.filter(lq.canvasFilter) || []
    }
  }
}
