<template>
  <div class="lq-arrow-handles" v-show="visible" :style="viewportStyle">
    <div class="handle h1" :style="{top: `${h1.y}px`, left: `${h1.x}px`}"></div>
    <div class="handle h2" :style="{top: `${h2.y}px`, left: `${h2.x}px`}"></div>
    <vue-moveable target=".lq-arrow-handles .h1" :draggable="true" :origin="false" @dragStart="onDragStart"
      @drag="onDrag1" @dragEnd="onDragEnd">
    </vue-moveable>
    <vue-moveable target=".lq-arrow-handles .h2" :draggable="true" :origin="false" @dragStart="onDragStart"
      @drag="onDrag2" @dragEnd="onDragEnd">
    </vue-moveable>
  </div>
</template>

<script>
import lq from '../lq-globals'

export default {

  mixins: [
    require('./mixins/viewport').default,
    require('./mixins/selection').default,
    require('./mixins/editable').default
  ],

  data () {
    return {
      h1: {x: 0, y: 0},
      h2: {x: 0, y: 0},
      onDrag1: this.dragHandler(1),
      onDrag2: this.dragHandler(2)
    }
  },

  computed: {

    visible () {
      return this.editable && this.topic?.typeUri === 'linqa.arrow'
    },

    topic () {
      return this.selectedTopic
    },

    pos () {
      return this.topic.pos
    },

    width () {
      return this.topic.viewProps['dmx.topicmaps.width']
    },

    angle () {
      return this.topic.viewProps['linqa.angle'] || 0
    },

    newWidth () {
      return Math.sqrt((this.h1.x - this.h2.x) ** 2 + (this.h1.y - this.h2.y) ** 2)
    },

    newAngle () {
      return 180 * Math.atan2(this.h1.y - this.h2.y, this.h1.x - this.h2.x) / Math.PI
    }
  },

  watch: {
    topic () {
      if (this.visible) {
        this.updateHandles()
      }
    }
  },

  methods: {

    onDragStart (e) {
      e.inputEvent.stopPropagation()      // prevent "selecto" from removing the selection
    },

    onDragEnd () {
      this.$store.dispatch('storeArrowHandles', this.topic)
    },

    dragHandler (nr) {
      return ({
        target, transform, left, top, right, bottom, beforeDelta, beforeDist, delta, dist, clientX, clientY
      }) => {
        // store old model
        const oldPos = {
          x: this[`h${nr}`].x,
          y: this[`h${nr}`].y
        }
        const oldWidth = this.newWidth
        // update model
        this[`h${nr}`].x = Math.round(left / lq.CANVAS_GRID) * lq.CANVAS_GRID
        this[`h${nr}`].y = Math.round(top / lq.CANVAS_GRID) * lq.CANVAS_GRID
        this.topic.setViewProp('dmx.topicmaps.width', this.newWidth)
        this.topic.setViewProp('linqa.angle', this.newAngle)
        // position correction
        const newPos = this[`h${nr}`]
        this.topic.setPosition({
          x: this.pos.x + (newPos.x - oldPos.x - this.newWidth + oldWidth) / 2,
          y: this.pos.y + (newPos.y - oldPos.y) / 2
        })
        // update view
        this.$store.dispatch('updateControlBox')
      }
    },

    updateHandles () {
      const alpha = Math.PI * this.angle / 180
      const sin = Math.sin(alpha)
      const cos = Math.cos(alpha)
      const cx = this.pos.x + this.width / 2
      const cy = this.pos.y + lq.ARROW_HEIGHT / 2
      const w2 = this.width / 2
      const w2sin = w2 * sin
      const w2cos = w2 * cos
      this.h1.x = cx + w2cos
      this.h1.y = cy + w2sin
      this.h2.x = cx - w2cos
      this.h2.y = cy - w2sin
    }
  }
}
</script>

<style>
.lq-arrow-handles .handle {
  position: absolute;
  width: 14px;
  height: 14px;
  background-color: #4af;     /* TODO: var(--highlight-color), several rules are affected */
  border: 2px solid white;
  border-radius: 50%;
  box-sizing: border-box;
  margin-top: -7px;
  margin-left: -7px;
  z-index: 10;
  cursor: move;
}

.lq-arrow-handles .moveable-control-box {
  display: none !important;
}
</style>
