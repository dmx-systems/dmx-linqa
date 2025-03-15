<template>
  <div class="lq-discussion" v-show="panelVisibility">

    <el-button class="close-button" type="primary" link icon="close" :title="closeTooltip" @click="close"></el-button>
    <lq-string class="heading">label.discussion</lq-string>
    <!-- Filter -->
    <div class="filter-wrapper" v-if="discussionFilter">
      <div class="filter">
        <lq-string>{{filterLabelKey}}</lq-string>
        <el-button class="close-button" type="primary" link icon="close" :title="resetTooltip"
          @click="resetDiscussionFilter">
        </el-button>
      </div>
    </div>
    <!-- Comments -->
    <div v-if="noComments" class="secondary"><lq-string html>label.no_comments</lq-string></div>
    <el-scrollbar v-else class="comments" ref="scrollbar" :always="true" v-loading="discussionLoading">
      <lq-comment v-for="comment in filteredDiscussion" :topic="comment" :key="comment.id" @reply="reply"
        @comment-ref-click="jumpTo">
      </lq-comment>
    </el-scrollbar>
    <!-- New comment -->
    <div class="new-comment-container" v-if="isWritable" v-loading="submitting">
      <div class="new-comment">
        <lq-comment-ref :comment="refComment" :closable="true" @click="jumpTo" @remove="removeCommentRef">
        </lq-comment-ref>
        <lq-document-ref :document="documentFilter" :closable="true"></lq-document-ref>
        <lq-note-ref :topic="noteFilter" :closable="true"></lq-note-ref>
        <lq-textblock-ref :topic="textblockFilter" :closable="true"></lq-textblock-ref>
        <div class="editor-container dmx-html-field">
          <quill v-model="newComment" :options="quillOptions" ref="newComment" @quill-ready="focus"></quill>
          <el-button class="attach-button" type="primary" link icon="paperclip" :title="attachTooltip"
            @click="openUploadDialog">
          </el-button>
        </div>
        <div class="attachments">
          <lq-attachment v-for="file in attachments" :file="file" :closable="true" :key="file.id"
            @remove="removeAttachment">
          </lq-attachment>
        </div>
      </div>
      <el-button class="submit-button" type="primary" link icon="promotion" :title="submitTooltip"
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
        comment => !this.discussionFilter || this.getRefTopicId(comment) === this.discussionFilter.id
      )
    },

    noComments () {
      return this.filteredDiscussion?.length === 0
    },

    refTopicIds () {
      const ids = []
      this.refComment && ids.push(this.refComment.id)
      this.discussionFilter && ids.push(this.discussionFilter.id)
      return ids
    },

    discussionFilter () {
      return this.$store.state.discussionFilter
    },

    documentFilter () {
      if (this.discussionFilter?.typeUri === 'linqa.document') {
        return this.discussionFilter
      }
    },

    noteFilter () {
      if (this.discussionFilter?.typeUri === 'linqa.note') {
        return this.discussionFilter
      }
    },

    textblockFilter () {
      if (this.discussionFilter?.typeUri === 'linqa.textblock') {
        return this.discussionFilter
      }
    },

    filterLabelKey () {
      // compute key from type URI, good idea?
      return 'label.' + this.discussionFilter.typeUri.split('.')[1] + '_filter'
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

    panelVisibility ()  {this.scrollDown()},
    discussion ()       {this.scrollDown()},
    discussionFilter () {this.scrollDown()}
  },

  methods: {

    close () {
      this.$store.dispatch('setPanelVisibility', false)
    },

    resetDiscussionFilter () {
      this.$store.dispatch('setDiscussionFilter', undefined)
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
          // Note: if there are no comments there is no scrollbar
          this.$refs.scrollbar?.scrollTo({
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

    getRefTopicId (comment) {
      const typeUri = this.discussionFilter.typeUri
      return comment.children[typeUri]?.id
    }
  },

  components: {
    'lq-comment':       require('./lq-comment').default,
    'lq-upload-dialog': require('./lq-upload-dialog').default,
    'lq-app-header': require('./lq-app-header').default

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
  padding: 0 15px;
  min-width: 340px;
  /*  background-color: var(--background-color); */    
  background-color: rgb(247,247,247);
  box-shadow: -5px 3px 6px -3px rgba(237,237,237,0.75);
  -webkit-box-shadow: -5px 3px 6px -3px rgba(237,237,237,0.75);
  -moz-box-shadow: -5px 3px 6px -3px rgba(237,237,237,0.75);

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

.lq-discussion .filter-wrapper {
  margin-bottom: 32px;
  margin-right: 10px;
}

.lq-discussion .filter {
  display: inline-flex;
  align-items: center;
  background-color: var(--primary-color);
  padding: 5px 8px;
}

.lq-discussion .filter .close-button {
  font-size: 20px;
  margin-left: 6px;
}

.lq-discussion .comments {
  height: unset;        /* Element Plus default el-scrollbar height of 100% attaches new-comment panel to */
                        /* window bottom. We want new-comment panel always be attached to comments. */
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
