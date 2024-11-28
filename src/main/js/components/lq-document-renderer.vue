<template>
  <pre v-if="isText">{{text}}</pre>
  <img v-else-if="isImage" :src="fileUrl" @loadstart="loading" @load="complete">
  <audio v-else-if="isAudio" :src="fileUrl" controls></audio>
  <video v-else-if="isVideo" :src="fileUrl" controls @loadeddata="update"></video>
  <lq-pdf-viewer v-else-if="isPDF" :topic="topic" :src="fileUrl" @loading="loading" @complete="complete">
  </lq-pdf-viewer>
  <div v-else-if="isOfficeDocument">
    <img class="office-icon" :src="iconUrl">
    <div class="label">{{fileName}}</div>
  </div>
</template>

<script>
import dmx from 'dmx-api'

export default {

  mixins: [
    require('./mixins/doc-util').default,
  ],

  created () {
    this.initText()
  },

  props: {
    topic: {                  // the topic to render
      type: dmx.ViewTopic,
      required: true
    }
  },

  data () {
    return {
      text: ''                // used only for text files: the contained text (String)      FIXME: 2x ?
    }
  },

  watch: {
    file () {
      this.initText()
    }
  },

  methods: {

    initText () {
      if (this.isText) {
        this.$store.dispatch('getFileContent', this.path).then(content => {
          this.text = content
        })
      }
    },

    loading () {
      this.$emit('loading')
    },

    complete () {
      this.$emit('complete')
    },

    update() {
      // this.$emit('update')     // ### TODO
    }
  }
}
</script>
