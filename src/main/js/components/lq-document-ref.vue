<template>
  <div :class="['lq-document-ref', 'lq-comment-target-ref', {closable}]" v-if="document" @click="reveal">
    <span class="icon fa fa-fw fa-file-o"></span>
    <span class="doc-name label">{{docName}}</span>
    <el-button class="close-button" v-if="closable" type="primary" link icon="close" :title="resetTooltip"
      @click.stop="close">
    </el-button>
  </div>
</template>

<script>
import lq from '../lq-globals'

export default {

  props: {
    document: Object,       // the referred-to Document, optional (plain Object, not a dmx.Topic)
    closable: Boolean       // if true the close-button is rendered, optional
  },

  computed: {

    docNames () {
      return {
        lang1: this.document.children['linqa.document_name#linqa.lang1']?.value,
        lang2: this.document.children['linqa.document_name#linqa.lang2']?.value
      }
    },

    docName () {
      const docNames = this.docNames
      if (docNames.lang1 && docNames.lang2) {
        return docNames[lq.langSuffix(this.lang)]
      } else if (docNames.lang1) {
        return docNames.lang1
      } else if (docNames.lang2) {
        return docNames.lang2
      }
    },

    lang () {
      return this.$store.state.lang
    },

    resetTooltip () {
      return lq.getString('tooltip.reset_filter')
    }
  },

  methods: {

    reveal () {
      this.$store.dispatch('revealDocument', this.document)
    },

    close () {
      this.$store.dispatch('setDocumentFilter', undefined)
    }
  }
}
</script>

<style>
.lq-document-ref {
  display: inline-block;
  background-color: var(--primary-color-light);
  padding: 6px;
  cursor: pointer;
}

.lq-document-ref.closable {
  background-color: var(--primary-color);
}

.lq-document-ref .icon {
  color: var(--primary-color);
}

.lq-document-ref.closable .icon,
.lq-document-ref.closable .doc-name {
  color: black !important;
}

.lq-document-ref .close-button {
  font-size: 18px;
  margin-left: 6px;
}

.lq-document-ref .close-button > i {
  vertical-align: text-bottom;
}
</style>
