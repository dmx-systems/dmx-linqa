<template>
  <div class="lq-canvas" ref="canvas" :style="style" @wheel="wheelZoom" @mousedown.right="trackStart"
      @contextmenu.prevent>
    <lq-canvas-toolbar></lq-canvas-toolbar>
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
    <vue-selecto ref="selecto" :selectable-targets="['.lq-canvas-item']" :selectFromInside="false" hitRate="0"
      toggle-continue-select="shift" @dragStart="onDragSelectStart" @select="onSelect" @selectEnd="onSelectEnd">
    </vue-selecto>
    <lq-line-handles></lq-line-handles>
    <!-- Canvas panning -->
    <vue-moveable target=".lq-canvas" :draggable="true" @dragStart="onPanStart" @drag="onPan" @dragEnd="onPanEnd">
    </vue-moveable>
  </div>
</template>

<script>
import lq from '../lq-globals'

const context = {}

export default {

  mixins: [
    require('./mixins/topicmap').default,
    require('./mixins/viewport').default,
    require('./mixins/selection').default,
    require('./mixins/canvas-events').default,
    require('./mixins/roles').default,
    require('./mixins/presentation-mode').default
  ],

  provide: {
    context
  },

  created () {
    context.config = this.config
  },

  data () {
    return {
      DEFAULT: {
        resizeStyle: 'x',               // 'x'/'xy'/'none' (String)
        autoHeight: true,
        rotateEnabled: true,
        moveHandler: this.moveHandler,
        multiEnabled: true,             // topic can be target of a multi-command (lock/unlock/duplicate/delete)
        raiseOnSelect: true,
        zIndex: 0
      },
      CONFIG: {
        'linqa.document': {
          resizeStyle: 'xy',
        },
        'linqa.note': {
          resizeStyle: 'xy',
        },
        'linqa.textblock': {
          resizeStyle: 'xy',
        },
        'linqa.shape': {
          resizeStyle: 'xy',
          autoHeight: false,
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
      groupHover: false,                // true while group is hovered
      startZoom: undefined              // used while pinching (number)
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

    isSelectionModifiable () {
      return !this.presentationMode && this.isAuthor &&
        this.selection.every(topic => !topic.children['linqa.locked']?.value)
    },

    // 3 vue-moveable config flags

    draggable () {
      return this.isSelectionModifiable
    },

    resizable () {
      return this.isSelectionModifiable && this.resizeStyle !== 'none'
    },

    rotatable () {
      return this.isSelectionModifiable && this.rotateEnabled
    },

    //

    renderDirections () {
      return {
        'x': ['e'],
        'xy': ['s', 'se', 'e'],
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
    }
  },

  methods: {

    // TODO: make it mode.js mixin, call it from lq-line-handles.vue as well, make current mode.js mixin form.js mixin
    mode (topic) {
      return this.$store.state.isEditActive.includes(topic.id) ? 'form' : 'info'
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

    //

    moveHandler (topic, dx, dy) {
      const p = this.dragStartPos[topic.id]
      topic.setPosition({                                                 // update model
        x: p.x + lq.snapToGrid(dx),
        y: p.y + lq.snapToGrid(dy)
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

    /**
     * @param   width     in pixel (Number)
     * @param   height    in pixel (Number), or 'auto' (String)
     */
    setSize (target, width, height) {
      // Note: for measurement "moveable" relies on immediately updated *view*.
      // The view updated by Vue.js (as based on *model*) is only up-to-date at next tick.
      const topic = this.findTopic(target)
      // update model
      topic.setViewProp('dmx.topicmaps.width', width)
      topic.setViewProp('dmx.topicmaps.height', height)
      // update view
      target.style.width = `${width}px`
      target.style.height = `${height}${height !== 'auto' ? 'px' : ''}`
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
    'lq-canvas-toolbar': require('./lq-canvas-toolbar').default,
    'lq-line-handles': require('./lq-line-handles').default,
    'vue-selecto': require('vue-selecto').default
  }
}
</script>

<style>
.lq-canvas {
  position: relative;   /* the canvas toolbar is aligned to the *right* canvas border */
  flex-grow: 1;
  background-image: url("../../resources-build/grid.png");
  min-width: 0;
  overflow: hidden;
}

.lq-canvas .content-layer {
  /* width: 10000px; */       /* avoid early line wrapping TODO: needed? */
}

.lq-canvas .content-layer.transition {
  transition: transform .5s;
}

.lq-canvas .content-layer .group-toolbar {
  position: absolute;
  white-space: nowrap;
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

.lq-canvas > .moveable-control-box {
  display: none !important;
  /* pointer-events: none; */
  /* width: 0; */
  /* height: 0; */
}
</style>
