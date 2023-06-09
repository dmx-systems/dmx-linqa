/**
 * Note: the host component is expected to hold "topic": a Document topic.
 */
export default {

  computed: {

    file () {
      // Note: empty topics created while edit have ID -1
      const lang1 = this.files.lang1 && this.files.lang1.id != -1
      const lang2 = this.files.lang2 && this.files.lang2.id != -1
      if (lang1 && lang2) {
        return this.files[this.lang]
      } else if (lang1) {
        return this.files.lang1
      } else if (lang2) {
        return this.files.lang2
      }
    },

    files () {
      return {
        lang1: this.getFile('lang1'),
        lang2: this.getFile('lang2')
      }
    },

    fileUrl () {
      return '/filerepo/' + encodeURIComponent(this.path)
    },

    path () {
      return this.getPath(this.file)
    },

    lang () {
      return this.$store.state.lang
    }
  },

  methods: {

    getFile (lang) {
      return this.topic.children['dmx.files.file#linqa.' + lang]
    },

    getPath (file) {
      return this.getPathTopic(file)?.value
    },

    getPathTopic (file) {
      return file?.children['dmx.files.path']
    }
  }
}
