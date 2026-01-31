<template>
  <div class="lq-canvas-toolbar">
    <el-dropdown class="add-button" v-if="isAddButtonVisibile" trigger="click" @command="handle" placement="top-start">
      <el-button type="primary" link class="fa fa-plus" :title="addTooltip"></el-button>
      <template #dropdown>
        <el-dropdown-menu class="lq-new-dropdown">
          <el-dropdown-item command="newDocument">
            <span class="fa fa-paperclip"></span>
            <lq-string>item.document</lq-string>
          </el-dropdown-item>
          <el-dropdown-item command="newNote">
            <span class="fa fa-sticky-note"></span>
            <lq-string>item.note</lq-string>
          </el-dropdown-item>
          <el-dropdown-item command="newTextblock">
            <span class="fa fa-file-text"></span>
            <lq-string>item.textblock</lq-string>
          </el-dropdown-item>
          <el-dropdown-item command="newHeading" divided>
            <span class="fa fa-header"></span>
            <lq-string>item.heading</lq-string>
          </el-dropdown-item>
          <el-dropdown-item command="newShape">
            <span class="fa fa-circle"></span>
            <lq-string>item.shape</lq-string>
          </el-dropdown-item>
          <el-dropdown-item command="newLine">
            <span class="fa fa-long-arrow-right"></span>
            <lq-string>item.line</lq-string>
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <div class="view-controls">
      <el-button type="primary" link class="fa fa-arrows" :title="homeTooltip" @click="home"></el-button>
      <el-button type="primary" link class="fa fa-crosshairs" :title="fullscreenTooltip" :disabled="isTopicmapEmpty"
        @click="zoomToFit">
      </el-button>
      <el-button v-if="isBigScreen" type="primary" link class="fa fa-search-plus" :title="zoomInTooltip"
        @click="zoomIn">
      </el-button>
      <el-button v-if="isBigScreen" type="primary" link class="fa fa-search-minus" :title="zoomOutTooltip"
        @click="zoomOut">
      </el-button>
    </div>
    <el-button class="discussion-button fa fa-commenting" v-if="!panelVisibility" type="primary" link
      :title="openDiscussionTooltip" @click="openDiscussion">
    </el-button>
  </div>
</template>

<script>
import dmx from 'dmx-api'
import lq from '../lq-globals'

let synId = -1          // generator for transient topic IDs, needed for topics not yet saved, counts down

export default {

  mixins: [
    require('./mixins/topicmap').default,
    require('./mixins/viewport').default,
    require('./mixins/roles').default,
    require('./mixins/screen').default,
    require('./mixins/presentation-mode').default
  ],

  computed: {

    isAddButtonVisibile () {
      return this.isAuthor && !this.presentationMode
    },

    panelVisibility () {
      return this.$store.state.panelVisibility
    },

    canvas () {
      return document.querySelector('.lq-canvas')
    },

    addTooltip () {
      return lq.getString('tooltip.add')
    },

    homeTooltip () {
      return lq.getString('tooltip.home')
    },

    fullscreenTooltip () {
      return lq.getString('tooltip.zoom_to_fit')
    },

    zoomInTooltip () {
      return lq.getString('tooltip.zoom_in')
    },

    zoomOutTooltip () {
      return lq.getString('tooltip.zoom_out')
    },

    openDiscussionTooltip () {
      return lq.getString('tooltip.open_panel')
    }
  },

  methods: {

    // "Add" Menu

    handle (command) {
      this[command]()
    },

    // 6 methods called by dropdown menu

    newDocument () {
      // TODO: align it with note/heading/textblock? Possibly current model-driven approach not needed anymore
      // as meanwhile document(name)s are auto-translated, that is single input field in create-form.
      this.$store.dispatch('newTopic', this.newDocumentViewTopic())
    },

    newNote () {
      this.$store.dispatch('newTopic', this.newViewTopic('linqa.note'))
    },

    newTextblock () {
      this.$store.dispatch('newTopic', this.newViewTopic('linqa.textblock'))
    },

    newHeading () {
      this.$store.dispatch('newTopic', this.newViewTopic('linqa.heading'))
    },

    newShape () {
      this.$store.dispatch('createShape', this.newViewTopic('linqa.shape'))
    },

    newLine () {
      this.$store.dispatch('createLine', this.newViewTopic('linqa.line'))
    },

    //

    newDocumentViewTopic () {
      const model = dmx.typeCache.getTopicType('linqa.document').newFormModel()
      model.id = newSynId()
      model.viewProps = this.viewProps('linqa.document')
      delete model.children['dmx.accesscontrol.username#linqa.reaction']      // don't create empty default-reaction
      return new dmx.ViewTopic(model)
    },

    newViewTopic (typeUri) {
      return new dmx.ViewTopic({
        id: newSynId(),
        typeUri,
        value: '',        // used as intermediate note/textblock/heading model while create
        viewProps: this.viewProps(typeUri)
      })
    },

    /**
     * Creates default view props for *all* the 6 item types
     */
    viewProps (typeUri)  {
      const x = lq.snapToGrid((lq.CANVAS_BORDER - this.pan.x) / this.zoom)
      const y = lq.snapToGrid((lq.CANVAS_BORDER - this.pan.y) / this.zoom)
      return {
        'dmx.topicmaps.x': x,
        'dmx.topicmaps.y': y,
        'dmx.topicmaps.visibility': true,
        'dmx.topicmaps.pinned': false,
        'dmx.topicmaps.width': typeUri === 'linqa.line' ? lq.LINE_LENGTH :
                               typeUri === 'linqa.shape' ? lq.SHAPE_WIDTH : lq.ITEM_WIDTH,
        'dmx.topicmaps.height': typeUri === 'linqa.shape' ? lq.SHAPE_HEIGHT : undefined,
        'linqa.angle': 0
      }
    },

    // View Controls

    home () {
      const viewport = lq.getViewport()
      this.$store.dispatch('setViewport', {
        pan: viewport.pan,
        zoom: viewport.zoom,
        transition: true
      })
    },

    zoomToFit () {
      let xMin = 1000, xMax = -1000
      let yMin = 1000, yMax = -1000
      this.topics.forEach(topic => {
        const x1 = topic.pos.x
        const y1 = topic.pos.y
        const item = document.querySelector(`.lq-canvas-item[data-id="${topic.id}"]`)
        const x2 = x1 + item.clientWidth
        const y2 = y1 + item.clientHeight
        if (x1 < xMin) xMin = x1
        if (y1 < yMin) yMin = y1
        if (x2 > xMax) xMax = x2
        if (y2 > yMax) yMax = y2
      })
      const width = xMax - xMin
      const height = yMax - yMin
      const widthC = this.canvas.clientWidth - 2 * lq.CANVAS_BORDER
      const heightC = this.canvas.clientHeight - 2 * lq.CANVAS_BORDER
      const zoomW = widthC / width
      const zoomH = heightC / height
      const zoom = Math.min(zoomW, zoomH)
      const dx = (widthC / zoom - width) / 2
      const dy = (heightC / zoom - height) / 2
      const x = (dx - xMin) * zoom + lq.CANVAS_BORDER
      const y = (dy - yMin) * zoom + lq.CANVAS_BORDER
      this.$store.dispatch('setViewport', {pan: {x, y}, zoom, transition: true})
    },

    zoomIn () {
      this.zoomTo(this.zoom * lq.ZOOM_STEP_FACTOR)
    },

    zoomOut () {
      this.zoomTo(this.zoom / lq.ZOOM_STEP_FACTOR)
    },

    zoomTo (zoom) {
      this.setZoom(zoom, this.canvas.clientWidth / 2, this.canvas.clientHeight / 2, true)
    },

    openDiscussion () {
      this.$store.dispatch('setPanelVisibility', true)
    }
  }
}

function newSynId () {
  return synId--
}
</script>

<style>
.lq-canvas-toolbar .el-button {
  font-size: 24px;
}

.lq-canvas-toolbar .view-controls {
  position: absolute;
  bottom: 5px;
  left: 40%;
  display: flex;
  padding: 12px !important;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 54px;
  border: 1px solid #fafafa;
  z-index: 1; 
}

.lq-canvas-toolbar .view-controls .el-button + .el-button {
  margin-left: 16px;    /* Element Plus default for neighboring buttons is 12px */
}

.lq-canvas-toolbar .add-button {
  position: absolute;
  bottom: 10px;
  left: 10px;
  padding: 7px 10px;
  background-color: var(--light-color);
  border-radius: 54px;
  z-index: 1;
}

.lq-canvas-toolbar .discussion-button {
  position: absolute;
  top: 5px;
  right: 5px;
  padding: 10px !important;
  background-color: var(--light-color);
  border-radius: 54px;
  z-index: 1;
}

.lq-canvas-toolbar .discussion-button:hover {
  background-color: var(--light-color) !important;
}

/* the actual dropdown menus are body mounted */

/* Note: copy in lq-app-header.vue (burger menu) */
.lq-new-dropdown .fa {
  font-size: 1.1em;
  width: 2.3em;
  text-align: center;
  margin-left: -0.7em;
}
</style>
