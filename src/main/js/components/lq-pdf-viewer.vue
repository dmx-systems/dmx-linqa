<template>
  <div :class="['lq-pdf-viewer', {fullscreen}]">
    <el-scrollbar :always="true">
      <canvas ref="canvas"></canvas>
    </el-scrollbar>
    <div class="toolbar upper" :style="toolbarStyle">
      <el-button type="primary" link :icon="fullscreenIcon" :title="fullscreenTooltip" @click="toggleFullscreen">
      </el-button>
    </div>
    <div class="toolbar lower" v-if="pagerVisibility" :style="toolbarStyle">
      <el-button type="primary" link icon="arrow-left" @click="prevPage"></el-button>
      <span>{{pageNr}} / {{numPages}}</span>
      <el-button type="primary" link icon="arrow-right" @click="nextPage"></el-button>
    </div>
  </div>
</template>

<script>
import dmx from 'dmx-api'
import lq from '../lq-globals'
import * as pdfjs from 'pdfjs-dist'
pdfjs.GlobalWorkerOptions.workerSrc = '/systems.dmx.linqa/pdfjs/pdf.worker.js'

export default {

  mixins: [
    require('./mixins/screen').default
  ],

  created () {
    this.fetchPDF().then(this.renderPage)
  },

  props: {
    topic: {          // the underlying Document topic (dmx.ViewTopic)
      type: dmx.ViewTopic,
      required: true
    },
    src: {
      type: String,
      required: true
    }
  },

  data () {
    return {
      numPages: 0     // inited by fetchPDF()
    }
  },

  computed: {

    pageNr () {
      return this.$store.state.pageNr[lq.langSuffix(this.lang)][this.topic.id]
    },

    multipage () {
      return this.numPages > 1
    },

    pagerVisibility () {
      return this.multipage
    },

    toolbarStyle () {
      if (!this.fullscreen) {
        return {
          'font-size': `${22 / this.zoom}px`    /* copied from viewport.js mixin's iconStyle() */
        }
      }
    },

    zoom () {
      return this.$store.state.zoom
    },

    panelPos () {
      return this.$store.state.panelPos
    },

    fullscreen () {
      return this.$store.state.fullscreen
    },

    lang () {
      return this.$store.state.lang
    },

    fullscreenIcon () {
      return this.fullscreen ? 'bottom-left' : 'top-right'
    },

    fullscreenTooltip () {
      return lq.getString(this.fullscreen ? 'tooltip.close_fullscreen' : 'tooltip.open_fullscreen')
    }
  },

  watch: {
    src () {
      // console.log('watch src', this.src)
      this.fetchPDF().then(this.renderPage)
    }
  },

  methods: {

    fetchPDF () {
      this.$emit('loading')
      return pdfjs.getDocument({
        url: this.src,
        cMapUrl: 'cmaps/'
      }).promise.then(pdf => {
        this.pdf = pdf    // Note: pdf must be non-reactive state, pdfjs doesn't work with JS Proxy object
        this.numPages = pdf.numPages
        this.$store.dispatch('initPageNr', this.topic.id)
      })
    },

    renderPage () {
      // console.log('renderPage', this.pageNr)
      const canvas = this.$refs.canvas
      if (!canvas) {      // TODO: why does this happen?
        console.warn('lq-pdf-viewer: no canvas')
        return
      }
      this.$emit('loading')
      this.pdf.getPage(this.pageNr).then(page => {
        let viewport = page.getViewport({scale: 1})
        if (this.fullscreen) {
          const width = this.isSmallScreen ? this.$el.clientWidth : this.panelPos
          viewport = page.getViewport({scale: 3 * width / viewport.width})
        }
        canvas.width = viewport.width
        canvas.height = viewport.height
        if (!this.fullscreen) {                         // in fullscreen mode control box is not on screen
          this.$store.dispatch('updateControlBox')      // sync control box once canvas size is known
        }
        return page.render({
          canvasContext: canvas.getContext('2d'),
          viewport
        }).promise
      }).then(() => {
        this.$emit('complete')
      })
    },

    prevPage () {
      this.$store.dispatch('prevPage', this.topic.id).then(changed => {
        changed && this.renderPage()
      })
    },

    nextPage () {
      this.$store.dispatch('nextPage', {topicId: this.topic.id, numPages: this.numPages}).then(changed => {
        changed && this.renderPage()
      })
    },

    toggleFullscreen () {
      this.$store.dispatch('setFullscreen', !this.fullscreen)
    }
  }
}
</script>

<style>
.lq-pdf-viewer {
  flex-grow: 1;         /* occupy its space if discussion panel is closed */
  position: relative;   /* position toolbars relative to pdf-viewer */
}

.lq-pdf-viewer canvas {
  width: 100%;
}

.lq-pdf-viewer .toolbar {
  position: absolute;
  visibility: hidden;
  padding: 2px;
  background-color: rgba(255, 255, 255, .7);
}

.lq-pdf-viewer .toolbar.upper {
  top: 0px;
  right: 0px;
}

.lq-pdf-viewer.fullscreen .toolbar.upper {
  right: 4px;     /* scrollbar pad */
}

.lq-pdf-viewer.fullscreen .toolbar.upper .el-button {
  font-size: 26px;
}

.lq-pdf-viewer .toolbar.lower {
  right: 1px;
  bottom: 4px;
}

.lq-pdf-viewer.fullscreen .toolbar.lower {
  right: 8px;     /* scrollbar pad */
}

.lq-pdf-viewer:hover .toolbar {
  visibility: visible;
}

.lq-pdf-viewer .toolbar .el-button {
  font-size: inherit;     /* inherit button size from toolbar */
}
</style>
