<template>
  <div :class="['lq-document', {'filter': isFiltered}, mode]" v-loading="isLoading">
    <template v-if="infoMode">
      <div class="discussion-button">
        <el-button type="text" icon="el-icon-chat-line-round" @click="setFilter" :title="discussTooltip"></el-button>
      </div>
      <div v-if="docName" class="doc-name" v-html="docName"></div>
      <pre v-if="isText">{{text}}</pre>
      <img v-if="isImage" :src="fileUrl" @loadstart="loading" @load="complete">
      <audio v-if="isAudio" :src="fileUrl" controls></audio>
      <video v-if="isVideo" :src="fileUrl" controls @loadeddata="update"></video>
      <lq-pdf-viewer v-if="isPDF" :topic="topic" :src="fileUrl" @loading="loading" @complete="complete"></lq-pdf-viewer>
      <div v-if="isOfficeDocument">
        <img class="office-icon" :src="iconUrl">
        <div class="label">{{fileName}}</div>
      </div>
    </template>
    <template v-else>
      <div class="field">
        <div class="field-label"><lq-string>label.document_name</lq-string> <span v-if="!isNew">({{lang1}})</span></div>
        <el-input v-model="docModel.names[lang1st].value" ref="docName"></el-input>
      </div>
      <template v-if="!isNew">
        <div class="translate">
          <el-button type="text" icon="el-icon-bottom" :title="translateTooltip" @click="translate"></el-button>
        </div>
        <div class="field">
          <div class="field-label"><lq-string>label.document_name</lq-string> <span>({{lang2}})</span></div>
          <el-input v-model="docModel.names[lang2nd].value"></el-input>
          <div :class="['edited-indicator', {edited: editedFlag}]"><lq-string>label.translation_edited</lq-string></div>
        </div>
      </template>
      <div class="field">
        <div class="field-label"><lq-string>label.file</lq-string> <span v-if="!isNew">({{lang1}})</span></div>
        <el-upload drag :action="uploadUrl" :on-success="onSuccess[lang1st]" :on-error="onError[lang1st]"
            :ref="'upload.' + lang1st" :before-upload="beforeUpload">
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">Drop file here or <em>click to upload</em></div>
        </el-upload>
        <div class="error">{{error[lang1st]}}</div>
        <el-input v-model="docModel.paths[lang1st].value"></el-input>
      </div>
      <div class="field" v-if="!isNew">
        <div class="field-label"><lq-string>label.file</lq-string> <span>({{lang2}})</span></div>
        <el-upload drag :action="uploadUrl" :on-success="onSuccess[lang2nd]" :on-error="onError[lang2nd]"
            :ref="'upload.' + lang2nd" :before-upload="beforeUpload">
          <i class="el-icon-upload"></i>
          <div class="el-upload__text">Drop file here or <em>click to upload</em></div>
        </el-upload>
        <div class="error">{{error[lang2nd]}}</div>
        <el-input v-model="docModel.paths[lang2nd].value"></el-input>
      </div>
      <el-button class="save-button" type="primary" size="medium" :disabled="saveButtonDisabled" @click="save">
        <lq-string>action.submit</lq-string>
      </el-button>
      <el-button size="medium" @click="cancel">
        <lq-string>action.cancel</lq-string>
      </el-button>
    </template>
    <lq-emoji-menu ref="emojiMenu" @select="reactWithEmoji"></lq-emoji-menu>
  </div>
</template>

<script>
import Vue from 'vue'
import dmx from 'dmx-api'
import lq from '../lq-globals'

export default {

  mixins: [
    require('./mixins/editable').default,
    require('./mixins/translation').default,
    require('./mixins/highlight').default,
    require('./mixins/doc-util').default,
    require('./mixins/emoji-menu').default
  ],

  created () {
    // console.log('lq-document', this.topic, this.topicBuffer, this.isNew)
    this.$emit('action', {
      key: 'action.download',
      icon: 'el-icon-download',
      handler: this.download,
      enabledForUser: true
    })
    this.initText()
  },

  mounted () {
    if (this.formMode) {
      this.$refs.docName.focus()    // FIXME: focus does not work in update form
    }
  },

  props: {
    topicBuffer: dmx.ViewTopic,     // the edit buffer (dmx.ViewTopic)    // TODO: unify "topic" and "topicBuffer"?
  },

  data () {
    return {
      biTypeUri: 'linqa.document_name',   // URI of the bilingual child type
      text: '',                           // used only for text files: the contained text (String)      FIXME: 2x ?
      isLoading: false,                   // true while document is loaded/saved (Boolean)
      saveButtonDisabled: false,          // true when save button is disabled (Boolean)
      onSuccess: {                        // upload success handler (2x Function)
        lang1: this.createSuccessHandler('lang1'),
        lang2: this.createSuccessHandler('lang2')
      },
      onError: {                          // upload error handler (2x Function)
        lang1: this.createErrorHandler('lang1'),
        lang2: this.createErrorHandler('lang2')
      },
      error: {                            // the error happened while upload, if any (String)
        lang1: '',
        lang2: ''
      }
    }
  },

  computed: {

    docNames () {
      return {
        lang1: this.topic.children['linqa.document_name#linqa.lang1'],
        lang2: this.topic.children['linqa.document_name#linqa.lang2']
      }
    },

    docLang () {
      const lang1 = this.docNames.lang1?.value
      const lang2 = this.docNames.lang2?.value
      if (lang1 && lang2) {
        return lq.langSuffix(this.lang)
      } else if (lang1) {
        return 'lang1'
      } else if (lang2) {
        return 'lang2'
      }
    },

    docName () {
      // Note: docLang is undefined if neiter "lang1" nor "lang2" is filled
      return this.highlight(this.topic, this.docNames[this.docLang]?.value)
    },

    docModel () {
      if (this.isNew) {
        return {
          names: this.docNames,
          files: this.files,
          paths: this.pathTopics
        }
      } else {
        return {
          names: {
            lang1: this.topicBuffer.children['linqa.document_name#linqa.lang1'],
            lang2: this.topicBuffer.children['linqa.document_name#linqa.lang2']
          },
          files: {
            lang1: this.topicBuffer.children['dmx.files.file#linqa.lang1'],
            lang2: this.topicBuffer.children['dmx.files.file#linqa.lang2']
          },
          paths: {
            lang1: this.getPathTopic(this.topicBuffer.children['dmx.files.file#linqa.lang1']),
            lang2: this.getPathTopic(this.topicBuffer.children['dmx.files.file#linqa.lang2'])
          }
        }
      }
    },

    pathTopics () {
      return {
        lang1: this.getPathTopic(this.files.lang1),
        lang2: this.getPathTopic(this.files.lang2)
      }
    },

    uploadUrl () {
      return '/upload/' + encodeURIComponent('/')
    },

    isText () {
      return this.mediaType?.startsWith('text/')
    },

    isImage () {
      return this.mediaType?.startsWith('image/')
    },

    isAudio () {
      return this.mediaType?.startsWith('audio/')
    },

    isVideo () {
      return this.mediaType?.startsWith('video/')
    },

    isPDF () {
      return this.mediaType === 'application/pdf'
    },

    isOfficeDocument () {
      return [
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.oasis.opendocument.text',
        'application/vnd.oasis.opendocument.spreadsheet',
        'application/vnd.oasis.opendocument.presentation'
      ].includes(this.mediaType)
    },

    isFiltered () {
      return this.documentFilter?.id === this.topic.id
    },

    documentFilter () {
      return this.$store.state.documentFilter
    },

    discussTooltip () {
      return lq.getString('tooltip.discuss')
    }
  },

  watch: {
    file () {
      this.initText()
    }
  },

  methods: {

    update() {
      // this.$emit('update')     // ### FIXME?
    },

    initText () {
      if (this.isText) {
        this.$store.dispatch('getFileContent', this.path).then(content => {
          this.text = content
        })
      }
    },

    setFilter () {
      this.$store.dispatch('setDocumentFilter', this.topic)
    },

    save () {
      this.loading()
      let action, arg, msgBox
      if (this.isNew) {
        action = 'createDocument'
        arg = {topic: this.topic}
        msgBox = 'confirm'
      } else {
        action = 'update'
        arg = this.topic
        // transfer edit buffer to topic model
        this.topic.children['linqa.translation_edited'] = {value: this.editedFlag}
        Vue.set(this.topic.children, 'linqa.document_name#linqa.lang1', this.docModel.names.lang1)
        Vue.set(this.topic.children, 'linqa.document_name#linqa.lang2', this.docModel.names.lang2)
        this.topic.children['dmx.files.file#linqa.lang1'] = this.docModel.paths.lang1.value ? this.docModel.files.lang1
          : undefined
        this.topic.children['dmx.files.file#linqa.lang2'] = this.docModel.paths.lang2.value ? this.docModel.files.lang2
          : undefined
      }
      this.$store.dispatch(action, arg).catch(error => {
        return this.handleError(error, msgBox)
      }).then(result => {
        if (result === 'confirm') {
          arg.monolingual = true
          this.$store.dispatch(action, arg).catch(error => {
            errorHandler(error)     // generic error handler ### FIXME?
          })
        }
      }).catch(result => {
        // console.log('cancel', result)
      }).finally(() => {
        this.complete()
      })
    },

    download () {
      this.$store.dispatch('downloadFile', this.path)
    },

    loading () {
      // console.log('loading')
      this.isLoading = true
    },

    complete () {
      this.isLoading = false
    },

    createSuccessHandler (lang) {
      return (response, file, fileList) => {
        this.$refs['upload.' + lang].clearFiles()
        // el-upload's files-list is removed from DOM only after clearFiles() animation has finished. Only then we must
        // update component state and trigger recalculation of the control box size (see updated() in editable.js mixin)
        // TODO: proper synchronization with animation end
        setTimeout(() => {
          const fileTopic = response.topic
          delete fileTopic.assoc    // the lead-to-parent-folder assoc must not be contained in create/update request
          const topic = this.isNew ? this.topic : this.topicBuffer
          topic.children['dmx.files.file#linqa.' + lang] = fileTopic
          this.saveButtonDisabled = false
        }, 1000)
      }
    },

    createErrorHandler (lang) {
      return (error, file, fileList) => {
        this.error[lang] = `${error.name}: ${error.message}`
        this.saveButtonDisabled = false
      }
    },

    beforeUpload (file) {
      this.saveButtonDisabled = true
    }
  }
}
</script>

<style>
.lq-document {
  box-sizing: border-box;
  height: 100%;
  padding: 8px;
  background-color: var(--background-color);
}

.lq-document.filter {
  background-color: var(--primary-color);
}

.lq-document.filter .discussion-button {
  background-color: var(--primary-color);
}

.lq-document.info {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.lq-document .doc-name {
  font-weight: bold;
  margin-bottom: 10px;
}

.lq-document .discussion-button {
  position: absolute;
  top: 0;
  right: -28px;
  padding: 4px;
  background-color: var(--background-color);
  border-top-right-radius: 14px;
  border-bottom-right-radius: 14px;
}

.lq-document .discussion-button .el-button {
  font-size: 18px;
}

.lq-document > pre {
  line-height: 1.4em;
  white-space: pre-wrap;
}

.lq-document > img {
  width: 100%;
}

.lq-document img.office-icon {
  height: 48px;
}

.lq-document .translate {
  text-align: center;
  margin-top: 12px;
}

.lq-document .translate .el-button {
  font-size: 24px;
}

.lq-document .save-button {
  margin-top: var(--field-spacing);
}

.lq-document .el-upload-dragger {
  height: 90px;             /* Element UI default is 180px */
}

.lq-document .el-upload-dragger .el-icon-upload {
  font-size: 50px;          /* Element UI default is 67px */
  margin: 8px 0 0 0;        /* Element UI default is 40px 0 16px */
}

.lq-document .error {
  color: var(--color-danger);
}
</style>
