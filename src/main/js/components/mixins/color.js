import lq from '../../lq-globals'

export default {
  computed: {

    color () {
      return this.topic.children['linqa.color']?.value || lq.COLOR_PALETTE.background[1] // default is gray  // TODO: FG
    },

    colorAsId () {
      return this.color.replace('#', '').replace('(', '-').replace(')', '').replaceAll(' ', '')
    }
  }
}
