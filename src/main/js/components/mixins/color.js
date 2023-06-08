import zw from '../../lq-globals'

export default {
  computed: {
    color () {
      return this.topic.children['linqa.color']?.value || zw.ITEM_COLORS[1]      // default is lavender
    }
  }
}
