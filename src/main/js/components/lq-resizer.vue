<template>
  <div class="lq-resizer" v-if="visible" :style="{left: left + 'px'}" @mousedown="onMouseDown"></div>
</template>

<script>
export default {

  mixins: [
    require('./mixins/dragging').default,
    require('./mixins/screen').default
  ],

  created () {
    this.$store.watch(state => state.panelVisibility, visible => {
      if (visible) {
        this.$nextTick(() => {
          this.resize()
        })
      }
    })
    //
    window.addEventListener('resize', e => {
      if (this.visible) {
        this.$store.dispatch('readPanelPosFromView')      // read state from view
      }
    })
  },

  mounted () {
    this.$store.dispatch('setViewComps', {resizer: this})
    this.resize()
  },

  computed: {

    visible () {
      return this.isBigScreen && this.panelVisibility
    },

    panelVisibility () {
      return this.$store.state.panelVisibility
    },

    left () {
      return this.$store.state.panelPos
    }
  },

  methods: {

    onMouseDown ({pageX: initialPageX}) {
      const left = this.left
      const {addEventListener, removeEventListener} = window

      this.dragStart('drag-resizer')

      const onMouseMove = ({pageX}) => {
        this.$store.dispatch('setPanelPos', left + pageX - initialPageX)
        this.resize()
      }

      const onMouseUp = () => {
        removeEventListener('mousemove', onMouseMove)
        removeEventListener('mouseup',   onMouseUp)
        this.dragStop()
      }

      addEventListener('mousemove', onMouseMove)
      addEventListener('mouseup', onMouseUp)
    },

    // Public API

    /**
     * Updates view according to model (store.state.panelPos)
     */
    resize () {
      const container = document.querySelector('.lq-webclient')
      const paneL     = document.querySelector('.left-panel')
      const paneR     = document.querySelector('.right-panel')
      const paneLWidth = this.left
      const paneRWidth = container.clientWidth - paneLWidth
      paneL.style.width = `${paneLWidth}px`
      paneR.style.width = `${paneRWidth}px`
    }
  }
}
</script>

<style>
.lq-resizer {
  position: absolute;
  width: 16px;
  height: 100%;         /* we can't flex-grow (like lq-canvas and lq-discussion) because we're absolutely positioned */
  margin-left: -8px;    /* -width / 2 */
  z-index: 2;           /* make it appear before discussion panel */
  cursor: col-resize;
  /* background-color: rgba(255, 0, 0, .3); */
}
</style>
