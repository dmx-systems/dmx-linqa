import lq from '../../lq-globals'

const icons = {
  'application/msword': 'doc.svg',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx.svg',
  'application/vnd.ms-excel': 'xls.svg',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx.svg',
  'application/vnd.ms-powerpoint': 'ppt.svg',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx.svg',
  'application/vnd.oasis.opendocument.text': 'odt.png',
  'application/vnd.oasis.opendocument.spreadsheet': 'ods.png',
  'application/vnd.oasis.opendocument.presentation': 'odp.png'
}

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
        return this.files[lq.langSuffix(this.lang)]
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

    mediaType () {
      return this.file?.children['dmx.files.media_type']?.value
    },

    fileUrl () {
      return '/filerepo/' + encodeURIComponent(this.path)
    },

    iconUrl () {
      return '/systems.dmx.linqa/file-icons/' + icons[this.mediaType]
    },

    fileName () {
      return this.file.children['dmx.files.file_name'].value
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
