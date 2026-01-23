<template>
  <el-dialog class="lq-upload-dialog" :model-value="visible" :modal="false" width="400px" @open="clearError"
      @close="close">
    <el-upload drag :action="action" :accept="accept" :on-success="onSuccess" :on-error="onError" ref="upload">
      <i class="el-icon-upload"></i>
      <div class="el-upload__text">Drop file here or <em>click to upload</em></div>
    </el-upload>
    <div class="error">{{error}}</div>
  </el-dialog>
</template>

<script>
import dmx from 'dmx-api'

export default {

  props: {
    visible: {
      type: Boolean,
      required: true
    }
  },

  data () {
    return {
      accept: "image/*, .pdf",
      error: ''
    }
  },

  computed: {
    action () {
      return '/upload/' + encodeURIComponent('/')
    }
  },

  methods: {

    onSuccess (response, file, fileList) {
      this.$emit('attach', response.topic)
      this.$refs.upload.clearFiles()
      this.close()
    },

    onError (error, file, fileList) {
      this.error = `${error.name}: ${error.message}`
    },

    clearError () {
      this.error = ''
    },

    close () {
      this.$emit('close')
    }
  }
}
</script>

<style>
.lq-upload-dialog .error {
  color: var(--danger-color);
  margin-top: var(--field-spacing);
}
</style>
