<template>
  <div class="lq-canvas" :style="style" ref="canvas" @wheel="wheelZoom">
    <!-- Add menu -->
    <el-dropdown class="add-menu" v-if="isAuthor" trigger="click" @command="handle">
      <el-button class="add-button" type="text" icon="el-icon-circle-plus" :title="addTooltip"></el-button>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item command="newDocument"><lq-string>item.document</lq-string></el-dropdown-item>
        <el-dropdown-item command="newNote"><lq-string>item.note</lq-string></el-dropdown-item>
        <el-dropdown-item command="newTextblock"><lq-string>item.textblock</lq-string></el-dropdown-item>
        <el-dropdown-item command="newHeading" divided><lq-string>item.heading</lq-string></el-dropdown-item>
        <el-dropdown-item command="newShape"><lq-string>item.shape</lq-string></el-dropdown-item>
        <el-dropdown-item command="newLine"><lq-string>item.line</lq-string></el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <!-- Toolbar -->
    <div class="canvas-toolbar">
      <el-button type="text" icon="el-icon-s-home" :title="homeTooltip" @click="home"></el-button>
      <el-button type="text" icon="el-icon-full-screen" :title="fullscreenTooltip" @click="zoomToFit"></el-button>
      <el-button type="text" icon="el-icon-zoom-in" :title="zoomInTooltip" @click="stepZoom(.1)"></el-button>
      <el-button type="text" icon="el-icon-zoom-out" :title="zoomOutTooltip" @click="stepZoom(-.1)"></el-button>
      <lq-canvas-search></lq-canvas-search>
    </div>
    <!-- Content layer -->
    <div :class="['content-layer', {transition}]" :style="viewportStyle" @transitionend="transitionend">
      <lq-canvas-item v-for="topic in topics" :topic="topic" :mode="mode(topic)" :key="topic.id"></lq-canvas-item>
      <vue-moveable ref="moveable" view-container=".content-layer" :target="targets" :draggable="draggable"
        :resizable="resizable" :rotatable="rotatable" :origin="false" :render-directions="renderDirections"
        @dragStart="onDragStart" @drag="onDrag" @dragEnd="onDragEnd" @clickGroup="onClickGroup"
        @dragGroupStart="onDragGroupStart" @dragGroup="onDragGroup" @dragGroupEnd="onDragGroupEnd"
        @resize="onResize" @resizeEnd="onResizeEnd" @rotate="onRotate" @rotateEnd="onRotateEnd"
        @mouseenter.native="onEnter" @mouseleave.native="onLeave">
      </vue-moveable>
      <div class="group-toolbar" v-show="isMultiSelection && groupHover && isAuthor" :style="groupToolbarStyle"
          @mouseenter="onEnter" @mouseleave="onLeave">
        <lq-string :value="objectCount" class="secondary" :style="buttonStyle">label.multi_select</lq-string>
        <el-button v-for="action in groupActions" v-if="isActionAvailable(action)" type="text"
          :title="actionLabel(action)" :icon="actionIcon(action)" :style="iconStyle" :key="action.key"
          @click="action.handler" @mousedown.native.stop>
        </el-button>
      </div>
    </div>
    <vue-selecto ref="selecto" :selectable-targets="['.content-layer .lq-canvas-item']" :selectFromInside="false"
      toggle-continue-select="shift" hitRate="0" @dragStart="onDragSelectStart" @select="onSelect"
      @selectEnd="onSelectEnd">
    </vue-selecto>
    <lq-line-handles></lq-line-handles>
  </div>
</template>

<script>
import dmx from 'dmx-api'
import lq from '../lq-globals'

const context = {}

let HEADER_HEIGHT
let synId = -1          // generator for temporary synthetic topic IDs, needed for topics not yet saved, counts down

export default {

  mixins: [
    require('./mixins/viewport').default,
    require('./mixins/selection').default,
    require('./mixins/roles').default,
    require('./mixins/zoom').default
  ],

  provide: {
    context
  },

  created () {
    context.config = this.config
  },

  mounted () {
    HEADER_HEIGHT = document.querySelector('.lq-header').clientHeight
  },

  data () {
    return {
      DEFAULT: {
        resizeStyle: 'x',               // 'x'/'xy'/'none' (String)
        rotateEnabled: true,
        moveHandler: this.moveHandler,
        multiEnabled: true,             // topic can be target of a multi-command (lock/unlock/duplicate/delete)
        raiseOnSelect: true,
        zIndex: 0
      },
      CONFIG: {
        'linqa.note': {
          resizeStyle: 'xy',
        },
        'linqa.textblock': {
          resizeStyle: 'xy',
        },
        'linqa.shape': {
          resizeStyle: 'xy',
          raiseOnSelect: false,
          zIndex: -1                    // place shapes in the background
        },
        'linqa.line': {
          resizeStyle: 'none',
          rotateEnabled: false,
          moveHandler: this.lineMoveHandler,
          zIndex: 1                     // place lines before other canvas items
        },
        'linqa.viewport': {
          resizeStyle: 'none',
          rotateEnabled: false,
          multiEnabled: false
        }
      },
      dragStartPos: undefined,          // object, key: topicId, value: object with x/y props
      groupToolbarPos: {x: 0, y: 0},    // object with x/y props
      groupHover: false                 // true while group is hovered
    }
  },

  computed: {

    groupActions () {
      return [{
        key: 'action.duplicate_multi', value: this.readableCount,
        icon: 'el-icon-document-copy', handler: this.duplicateMulti
      }, {
        key: 'action.lock_multi', value: this.writableCount,
        icon: 'el-icon-lock', handler: this.toggleLockMulti,
        only: this.isLinqaAdmin         // lock/unlock action is available only for admins
      }, {
        key: 'action.delete_multi', value: this.writableCount,
        icon: 'el-icon-delete-solid', handler: this.deleteMulti
      }]
    },

    style () {
      return {
        'background-position': `${this.bgPos.x}px ${this.bgPos.y}px`,
        'background-size': `${lq.CANVAS_GRID * this.zoom}px`
      }
    },

    groupToolbarStyle () {
      return {
        left: this.groupToolbarPos.x + 'px',
        top: this.groupToolbarPos.y + 'px'
      }
    },

    bgPos () {
      return  {
        x: this.pan.x % (lq.CANVAS_GRID * this.zoom),
        y: this.pan.y % (lq.CANVAS_GRID * this.zoom)
      }
    },

    topicmap () {
      return this.$store.state.topicmap
    },

    topics () {
      return this.topicmap?.topics.filter(lq.canvasFilter) || []
    },

    targets () {
      return this.selection.map(topic => document.querySelector(`.lq-canvas-item[data-id="${topic.id}"]`))
    },

    objectCount () {
      return this.selection.length
    },

    readableCount () {
      return this.selection.filter(this.readableTopicFilter).length
    },

    writableCount () {
      return this.selection.filter(this.writableTopicFilter).length
    },

    isSelectionLocked () {
      const topic = this.selection.find(topic => this.config('multiEnabled', topic))  // take 1st best topic as a sample
      // TODO: more elaborate calculation, are more topics locked or unlocked?
      const locked = topic?.children['linqa.locked']?.value
      return locked
    },

    isSelectionEditable () {
      return this.isLinqaAdmin || this.isEditor &&
        this.selection.every(topic => !topic.children['linqa.locked']?.value)
    },

    // 3 vue-moveable config flags

    draggable () {
      return this.isSelectionEditable
    },

    resizable () {
      return this.isSelectionEditable && this.resizeStyle !== 'none'
    },

    rotatable () {
      return this.isSelectionEditable && this.rotateEnabled
    },

    //

    renderDirections () {
      return {
        'x': ['e'],
        'xy': ['s', 'se', 'e'],    // ['n', 'nw', 'ne', 's', 'se', 'sw', 'e', 'w']    // TODO
        'none': false
      }[this.resizeStyle]
    },

    resizeStyle () {
      return this.selectedTopic ? this.config('resizeStyle') : 'none'       // 'none' is group default
    },

    rotateEnabled () {
      return this.selectedTopic ? this.config('rotateEnabled') : false      // false is group default
    },

    transition () {
      return this.$store.state.transition
    },

    lang () {
      return this.$store.state.lang
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
    }
  },

  methods: {

    // TODO: make it mode.js mixin, call it from lq-line-handles.vue as well, make current mode.js mixin form.js mixin
    mode (topic) {
      return this.$store.state.isEditActive.includes(topic.id) ? 'form' : 'info'
    },

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
      this.$store.dispatch('newTopic', this.newViewTopic('linqa.shape'))
    },

    newLine () {
      this.$store.dispatch('newTopic', this.newViewTopic('linqa.line'))
    },

    //

    newDocumentViewTopic () {
      return new dmx.ViewTopic({
        ...dmx.typeCache.getTopicType('linqa.document').newFormModel(),
        id: newSynId(),   // overwrite ID created in previous line
        viewProps: this.viewProps('linqa.document')
      })
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
      const x = snapToGrid((lq.CANVAS_BORDER - this.pan.x) / this.zoom)
      const y = snapToGrid((lq.CANVAS_BORDER - this.pan.y) / this.zoom)
      return {
        'dmx.topicmaps.x': x,
        'dmx.topicmaps.y': y,
        'dmx.topicmaps.visibility': true,
        'dmx.topicmaps.pinned': false,
        'dmx.topicmaps.width': typeUri === 'linqa.line' ? lq.LINE_LENGTH :
                               typeUri === 'linqa.shape' ? lq.SHAPE_WIDTH : lq.FORM_WIDTH,
        'dmx.topicmaps.height': typeUri === 'linqa.shape' ? lq.SHAPE_HEIGHT : undefined,
        'linqa.angle': 0
      }
    },

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
      const canvas = this.$refs.canvas
      const widthC = canvas.clientWidth - 2 * lq.CANVAS_BORDER
      const heightC = canvas.clientHeight - 2 * lq.CANVAS_BORDER
      const zoomW = widthC / width
      const zoomH = heightC / height
      const zoom = Math.min(zoomW, zoomH)
      const dx = (widthC / zoom - width) / 2
      const dy = (heightC / zoom - height) / 2
      const x = (dx - xMin) * zoom + lq.CANVAS_BORDER
      const y = (dy - yMin) * zoom + lq.CANVAS_BORDER
      this.$store.dispatch('setViewport', {pan: {x, y}, zoom, transition: true})
    },

    stepZoom (delta) {
      const c = this.$refs.canvas
      this.setZoom(this.zoom + delta, c.clientWidth / 2, c.clientHeight / 2, true)
    },

    wheelZoom (e) {
      this.setZoom(this.zoom - .003 * e.deltaY, e.clientX, e.clientY - HEADER_HEIGHT)
    },

    setZoom (zoom, cx, cy, transition) {
      zoom = Math.min(Math.max(zoom, .2), 2)
      const zoomChange = zoom - this.zoom
      const px = (cx - this.pan.x) / this.zoom * zoomChange
      const py = (cy - this.pan.y) / this.zoom * zoomChange
      this.$store.dispatch('setViewport', {
        pan: {
          x: this.pan.x - px,
          y: this.pan.y - py
        },
        zoom,
        transition
      })
    },

    isActionAvailable (action) {
      return action.only !== undefined ? action.only : true
    },

    actionLabel (action) {
      const key = action.key === 'action.lock_multi' && this.isSelectionLocked ? 'action.unlock_multi' : action.key
      return lq.getString(key, action.value)
    },

    actionIcon (action) {
      const icon = action.key === 'action.lock_multi' && this.isSelectionLocked ? 'el-icon-unlock' : action.icon
      return icon
    },

    duplicateMulti () {
      this.$store.dispatch('duplicateMulti', this.selection.filter(this.readableTopicFilter).map(topic => topic.id))
    },

    toggleLockMulti () {
      this.$store.dispatch('setLockedMulti', {
        locked: !this.isSelectionLocked,
        topics: this.selection.filter(this.writableTopicFilter)
      })
    },

    deleteMulti () {
      this.$store.dispatch('deleteMulti', this.selection.filter(this.writableTopicFilter).map(topic => topic.id))
    },

    readableTopicFilter (topic) {
      return this.config('multiEnabled', topic)
    },

    writableTopicFilter (topic) {
      return this.config('multiEnabled', topic) && (this.isLinqaAdmin || !topic.children['linqa.locked']?.value)
    },

    transitionend () {
      this.$store.dispatch('transitionEnd')
    },

    // "Selecto" event handling

    onDragSelectStart (e) {
      const target = e.inputEvent.target
      if (this.$refs.moveable.isMoveableElement(target) || this.targets.some(t => t === target || t.contains(target))) {
        e.stop()
      } else {
        if (e.inputEvent.target.classList.contains('lq-canvas')) {
          if (e.inputEvent.shiftKey) {
            e.inputEvent.stopPropagation()
          } else {
            e.preventDrag()
          }
        }
      }
    },

    onSelect (e) {
      this.$store.dispatch('updateSelection', {
        addTopics: e.added.map(el => el.__vue__.topic),
        removeTopicIds: e.removed.map(el => Number(el.dataset.id))
      })
      setTimeout(() => {    // Vue.nextTick() does not work here
        this.positionGroupToolbar()
      }, 100)
    },

    onSelectEnd (e) {
      if (e.isDragStart) {
        e.inputEvent.preventDefault()
        setTimeout(() => {
          this.$refs.moveable.dragStart(e.inputEvent)
        })
      }
    },

    // 11 vue-moveable event handlers

    onDragStart (e) {
      const topic = this.findTopic(e.target)
      this.dragStartPos = {[topic.id]: topic.pos}
    },

    onDrag (e) {
      this.config('moveHandler')(this.findTopic(e.target), e.dist[0], e.dist[1])
    },

    onDragEnd (e) {
      this.$store.dispatch('storeTopicPos', this.findTopic(e.target))
    },

    onClickGroup (e) {
      this.$refs.selecto.clickTarget(e.inputEvent, e.inputTarget)
    },

    onDragGroupStart (e) {
      // remembers start positions
      const p = {}
      e.targets.forEach(el => {
        const topic = this.findTopic(el)
        p[topic.id] = topic.pos
      })
      this.dragStartPos = p
    },

    onDragGroup (e) {
      e.targets.forEach(el => {
        const topic = this.findTopic(el)
        this.config('moveHandler', topic)(topic, e.dist[0], e.dist[1])
        this.positionGroupToolbar()
      })
    },

    onDragGroupEnd (e) {
      const topicCoords = e.targets.map(el => {
        const topic = this.findTopic(el)
        const pos = topic.pos
        return {
          topicId: topic.id,
          x: pos.x,
          y: pos.y
        }
      })
      this.$store.dispatch('storeTopicCoords', topicCoords)
    },

    onResize (e) {
      // Note: snap-to-grid while resize is in progress did not work as expected (the mouse is no longer over the
      // component when width is changed programmatically?). Workaround is to snap only on resize-end.
      const height = this.resizeStyle === 'xy' && e.height
      this.setSize(e.target, e.width, height)
    },

    onResizeEnd ({target}) {
      const topic = this.findTopic(target)
      const width = snapToGrid(topic.getViewProp('dmx.topicmaps.width'))
      const height = this.resizeStyle === 'xy' && snapToGrid(topic.getViewProp('dmx.topicmaps.height'))
      this.setSize(target, width, height)
      this.$store.dispatch('storeTopicSize', topic)
    },

    onRotate ({target, rotate}) {
      const angle = Math.round(rotate / 5) * 5          // rotate in 5 deg steps
      target.style.transform = `rotate(${angle}deg)`;   // view update not strictly required but improves rendering
      this.findTopic(target).setViewProp('linqa.angle', angle)     // update model
    },

    onRotateEnd (e) {
      this.$store.dispatch('storeTopicAngle', this.findTopic(e.target))
    },

    //

    onEnter () {
      this.groupHover = true
    },

    onLeave () {
      this.groupHover = false
    },

    //

    moveHandler (topic, dx, dy) {
      const p = this.dragStartPos[topic.id]
      topic.setPosition({                                                 // update model
        x: p.x + snapToGrid(dx),
        y: p.y + snapToGrid(dy)
      })
    },

    lineMoveHandler (topic, dx, dy) {
      this.moveHandler(topic, dx, dy)
      const vm = document.querySelector('.lq-line-handles').__vue__       // update view
      if (vm.visible) {
        vm.updateHandles()
      }
    },

    //

    setSize (target, width, height) {
      // Note: for width measurement "moveable" relies on an up-to-date *view*.
      // In contrast updating the *model* (view props) updates the view asynchronously.
      const topic = this.findTopic(target)
      topic.setViewProp('dmx.topicmaps.width', width)         // update model
      target.style.width = `${width}px`                       // update view
      if (height) {
        topic.setViewProp('dmx.topicmaps.height', height)     // update model
        target.style.height = `${height}px`                   // update view
      }
    },

    positionGroupToolbar () {
      const selector = '.lq-canvas .content-layer .moveable-control-box'
      const moveableArea = document.querySelector(`${selector} .moveable-area`)
      if (moveableArea) {
        const controlBox = document.querySelector(selector)
        const match = controlBox.style.transform.match(/translate3d\((-?[0-9.]+)px, (-?[0-9.]+)px, 0px\)/)
        this.groupToolbarPos.x = Number(match[1])
        this.groupToolbarPos.y = Number(match[2]) + moveableArea.clientHeight
      }
    },

    findTopic (el) {
      return this.selection.find(topic => topic.id == el.dataset.id)      // Note: dataset values are strings
    },

    config (prop, topic = this.selectedTopic) {
      const c = this.CONFIG[topic.typeUri]
      const config = c && c[prop]
      return config !== undefined ? config : this.DEFAULT[prop]
    }
  },

  components: {
    'lq-canvas-item': require('./lq-canvas-item').default,
    'lq-canvas-search': require('./lq-canvas-search').default,
    'lq-line-handles': require('./lq-line-handles').default,
    'vue-selecto': require('vue-selecto').default
  }
}

function snapToGrid(value) {
  return Math.round(value / lq.CANVAS_GRID) * lq.CANVAS_GRID
}

function newSynId () {
  return synId--
}
</script>

<style>
.lq-canvas {
  position: relative;
  flex-grow: 1;
  background-image: url("../../resources-build/grid.png");
  min-width: 0;
  overflow: hidden;
}

.lq-canvas .add-menu {
  position: absolute;   /* don't consume canvas space */
}

.lq-canvas .add-menu .add-button {
  position: relative;   /* only positioned elements have a z-index; "absolute" would displace dropdown menu */
  z-index: 1;           /* place button above canvas items */
  font-size: 24px;
  margin: 8px;
}

.lq-canvas .canvas-toolbar {
  position: absolute;
  top: 4px;
  right: 16px;
  z-index: 1;           /* place buttons above canvas items */
}

.lq-canvas .canvas-toolbar .el-button {
  font-size: 24px;
}

.lq-canvas .canvas-toolbar .lq-canvas-search {
  margin-left: 15px;
}

.lq-canvas .content-layer {
  width: 10000px;       /* avoid early line wrapping */
}

.lq-canvas .content-layer.transition {
  transition: transform .5s;
}

.lq-canvas .content-layer .group-toolbar {
  position: absolute;
  padding-top: 4px;
  padding-bottom: 12px;
}

.lq-canvas .content-layer .group-toolbar .el-button {
  margin-left: var(--button-spacing);
}

.lq-canvas .content-layer .moveable-control-box[data-able-draggable] .moveable-area {
  cursor: grab;
}

.lq-canvas .content-layer.moveable-view-dragging .lq-canvas-item,
.lq-canvas .content-layer.moveable-view-dragging .moveable-control-box .moveable-area {
  cursor: grabbing;
}
</style>
