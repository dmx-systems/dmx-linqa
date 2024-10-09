<template>
  <div class="lq-discussion" v-show="panelVisibility">
    <el-button class="close-button" type="text" icon="el-icon-close" :title="closeTooltip" @click="close"></el-button>
    <lq-string class="heading">label.discussion</lq-string>
    <!-- Filter -->
    <div class="filter-container" v-if="documentFilter || textblockFilter">
      <div class="filter" v-if="documentFilter" key="document-filter">
        <lq-string>label.document_filter</lq-string>
        <el-button class="close-button" type="text" icon="el-icon-close" :title="resetTooltip"
          @click="resetDocumentFilter">
        </el-button>
      </div>
      <div class="filter" v-if="textblockFilter" key="textblock-filter">
        <lq-string>label.textblock_filter</lq-string>
        <el-button class="close-button" type="text" icon="el-icon-close" :title="resetTooltip"
          @click="resetTextblockFilter">
        </el-button>
      </div>
    </div>
    <!-- Comments -->
    <div v-if="noComments" class="secondary"><lq-string html>label.no_comments</lq-string></div>
    <div v-else class="comments" v-loading="discussionLoading">
      <lq-comment v-for="comment in filteredDiscussion" :topic="comment" :key="comment.id" @reply="reply"
        @comment-ref-click="jumpTo">
      </lq-comment>
    </div>
    <!-- New comment -->
    <div class="new-comment-container" v-if="isWritable" v-loading="submitting">
      <div class="new-comment">
        <lq-comment-ref :comment="refComment" :closable="true" @click="jumpTo" @remove="removeCommentRef">
        </lq-comment-ref>
        <lq-document-ref :document="documentFilter" :closable="true"></lq-document-ref>
        <lq-textblock-ref :topic="textblockFilter" :closable="true"></lq-textblock-ref>
        <div class="editor-container dmx-html-field">
          <quill v-model="newComment" :options="quillOptions" ref="newComment" @quill-ready="focus"></quill>
          <el-button class="attach-button" type="text" icon="el-icon-paperclip" :title="attachTooltip"
            @click="openUploadDialog">
          </el-button>
        </div>
        <div class="attachments">
          <lq-attachment v-for="file in attachments" :file="file" :closable="true" :key="file.id"
            @remove="removeAttachment">
          </lq-attachment>
        </div>
      </div>
      <el-button class="submit-button" type="text" icon="el-icon-s-promotion" size="medium" :title="submitTooltip"
        @click="createComment">
      </el-button>
    </div>
    <lq-upload-dialog :visible="uploadDialogVisible" @attach="attach" @close="closeUploadDialog"></lq-upload-dialog>
  </div>
</template>

<script>
import lq from '../lq-globals'
import errorHandler from '../error-handler'

export default {

  mixins: [
    require('./mixins/error-handling').default
  ],

  data () {
    return {
      newComment: '',                 // new comment being entered by the user (String)
      refComment: undefined,          // comment the new comment relates to (a Comment topic, plain object)
      attachments: [],                // attachments for the new comment (array of File topics)
      uploadDialogVisible: false,     // upload dialog visibility (for comment attachments)
      submitting: false,              // true while submitting new comment
      quillOptions: {                 // options for new-comment quill editor
        placeholder: lq.getString('label.new_comment'),
        ...lq.quillOptions2
      }
    }
  },

  computed: {

    isWritable () {
      return this.$store.state.isWritable
    },

    panelVisibility () {
      return this.$store.state.panelVisibility
    },

    discussion () {
      return this.$store.state.discussion
    },

    discussionLoading () {
      return this.$store.state.discussionLoading
    },

    filteredDiscussion () {
      return this.discussion?.filter(
        comment => (!this.documentFilter  || this.getDocumentId(comment)  === this.documentFilter.id) &&
                   (!this.textblockFilter || this.getTextblockId(comment) === this.textblockFilter.id)
      )
    },

    noComments () {
      return this.filteredDiscussion?.length === 0
    },

    refTopicIds () {
      const ids = []
      this.refComment && ids.push(this.refComment.id)
      this.documentFilter  && ids.push(this.documentFilter.id)
      this.textblockFilter && ids.push(this.textblockFilter.id)
      return ids
    },

    documentFilter () {
      return this.$store.state.documentFilter
    },

    textblockFilter () {
      return this.$store.state.textblockFilter
    },

    lang () {
      return this.$store.state.lang
    },

    fileTopicIds () {
      return this.attachments.map(file => file.id)
    },

    closeTooltip () {
      return lq.getString('tooltip.close_panel')
    },

    attachTooltip () {
      return lq.getString('tooltip.attach')
    },

    submitTooltip () {
      return lq.getString('tooltip.submit')
    },

    resetTooltip () {
      return lq.getString('tooltip.reset_filter')
    }
  },

  watch: {

    lang () {
      this.$store.dispatch('updatePlaceholder')
    },

    panelVisibility () {this.scrollDown()},
    discussion ()      {this.scrollDown()},
    documentFilter ()  {this.scrollDown()},
    textblockFilter () {this.scrollDown()}
  },

  methods: {

    close () {
      this.$store.dispatch('setPanelVisibility', false)
    },

    resetDocumentFilter () {
      this.$store.dispatch('setDocumentFilter', undefined)
    },

    resetTextblockFilter () {
      this.$store.dispatch('setTextblockFilter', undefined)
    },

    createComment () {
      const commentModel = {
        comment: this.newComment,
        refTopicIds: this.refTopicIds,
        fileTopicIds: this.fileTopicIds
      }
      this.submitting = true
      this.$store.dispatch('createComment', commentModel).then(comment => {
        this.resetNewCommentPanel(comment)
      }).catch(error => {
        return this.handleError(error, 'confirm')
      }).then(result => {
        if (result === 'confirm') {
          commentModel.monolingual = true
          this.$store.dispatch('createComment', commentModel).then(comment => {
            this.resetNewCommentPanel(comment)
          }).catch(error => {
            errorHandler(error)     // generic error handler
          })
        }
      }).catch(result => {
        // console.log('cancel', result)
      }).finally(() => {
        this.submitting = false
        this.focus()
      })
    },

    resetNewCommentPanel (comment) {
      this.newComment = ''
      this.$refs.newComment.setHTML('')     // TODO: atm vue-quill-minimum does not react on model change
      this.refComment = undefined
      this.attachments = []
      this.jumpTo(comment, lq.isChrome ? 'auto' : undefined)
    },

    reply (comment) {
      this.refComment = comment
    },

    jumpTo (comment, behavior) {
      this.$store.dispatch('jumpToComment', {comment, behavior})
    },

    /**
     * Scrolls down to bottom of discussion.
     */
    scrollDown () {
      if (this.panelVisibility) {
        this.$nextTick(() => {
          // Note: if there are no comments the "comments" element does not exist
          document.querySelector('.lq-discussion .comments')?.scroll({
            top: 100000,
            behavior: 'smooth'
          })
        })
      }
    },

    removeCommentRef () {
      this.refComment = undefined
    },

    removeAttachment (file) {
      this.attachments = this.attachments.filter(f => f.id !== file.id)
    },

    attach (file) {
      this.attachments.push(file)
    },

    focus () {
      this.$refs.newComment.focus()
    },

    openUploadDialog () {
      this.uploadDialogVisible = true
    },

    closeUploadDialog () {
      this.uploadDialogVisible = false
    },

    getDocumentId (comment) {
      return comment.children['linqa.document']?.id
    },

    getTextblockId (comment) {
      return comment.children['linqa.textblock']?.id
    }
  },

  components: {
    'lq-comment':       require('./lq-comment').default,
    'lq-upload-dialog': require('./lq-upload-dialog').default,
    quill: () => ({
      component: import('vue-quill-minimum' /* webpackChunkName: "vue-quill-minimum" */),
      loading: require('./lq-spinner')
    })
  }
}
</script>

<style>
.lq-discussion {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  position: relative;         /* place close-button relative to this element */
  box-sizing: border-box;
  z-index: 1;
  padding: 10px 0 10px 10px;
  background-color: var(--background-color);
}

.lq-discussion > .close-button {
  position: absolute;
  top: 6px;
  right: 6px;
  font-size: 30px;
}

.lq-discussion > .heading {
  font-size: 20px;
  margin-top: 14px;
  margin-bottom: 20px;
}

.lq-discussion .filter-container {
  margin-bottom: 32px;
  margin-right: 10px;
}

.lq-discussion .filter {
  display: inline-block;
  background-color: var(--primary-color);
  padding: 5px 8px;
}

.lq-discussion .filter .lq-string {
  font-size: 15px;
}

.lq-discussion .filter .close-button {
  font-size: 20px;
  margin-left: 6px;
}

.lq-discussion .filter .close-button > i {
  vertical-align: text-bottom;
}

.lq-discussion .comments {
  overflow: auto;
  position: relative;     /* scroll absolute positioned childs along, e.g. the "Translate" button */
}

.lq-discussion .comments .lq-comment {
  margin-right: 10px;
}

.lq-discussion .comments .lq-comment + .lq-comment {
  margin-top: 20px;
}

.lq-discussion .new-comment-container {
  display: flex;
  align-items: flex-end;
  margin-top: 20px;
}

.lq-discussion .new-comment-container .submit-button {
  font-size: 30px;
  margin: 0 10px 7px 10px;
}

.lq-discussion .new-comment {
  flex-grow: 1;
  background-color: white;
  padding: 12px;
  border-radius: 10px;
}

.lq-discussion .new-comment .editor-container {
  position: relative;
}

.lq-discussion .new-comment .ql-editor {
  max-height: 35vh;
  padding: 0 40px 0 0 !important;
}

.lq-discussion .new-comment .ql-editor.ql-blank::before {
  font-style: unset;
  left: unset;
  right: unset;
}

.lq-discussion .new-comment .lq-comment-target-ref {
  margin-bottom: 15px;
}

.lq-discussion .new-comment .lq-attachment {
  margin-top: 6px;
}

.lq-discussion .new-comment .lq-attachment:first-child {
  margin-top: 15px;
}

.lq-discussion .new-comment .attach-button {
  position: absolute;
  top: 0;
  right: 0;
  font-size: 20px;
}

.lq-discussion .new-comment .emoji-picker-button {
  top: -1px;
  right: 22px;
}
</style>
