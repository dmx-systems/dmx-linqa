import lq from '../../lq-globals'

export default {
  computed: {

    color () {
      return this.topic.children['linqa.color']?.value || lq.ITEM_COLORS[1]      // default is lavender
    },

    colorAsId () {
      return this.color.replace('#', '').replace('(', '-').replace(')', '').replaceAll(' ', '')
    }
  }
}
