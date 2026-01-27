<template>
  <div class="lq-divider" v-show="visible" :style="{left: panelPos + 'px'}"></div>
  <vue-moveable target=".lq-divider" :draggable="true" :origin="false" @dragStart="onDragStart" @drag="onDrag"
    @dragEnd="onDragEnd">
  </vue-moveable>
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
    this.$store.dispatch('setViewComps', {divider: this})
    this.resize()
  },

  computed: {

    visible () {
      return this.isBigScreen && this.panelVisibility
    },

    panelVisibility () {
      return this.$store.state.panelVisibility
    },

    panelPos () {
      return this.$store.state.panelPos
    }
  },

  methods: {

    onDragStart () {
      this.dragStart('drag-divider')
    },

    onDrag (e) {
      this.$store.dispatch('setPanelPos', this.panelPos + e.delta[0])
      this.resize()
    },

    onDragEnd () {
      this.dragStop()
    },

    // Public API

    /**
     * Updates view according to model (store.state.panelPos)
     */
    resize () {
      const container = document.querySelector('.lq-webclient')
      const paneL     = document.querySelector('.left-panel')
      const paneR     = document.querySelector('.right-panel')
      const paneLWidth = this.panelPos
      const paneRWidth = container.clientWidth - paneLWidth
      paneL.style.width = `${paneLWidth}px`
      paneR.style.width = `${paneRWidth}px`
    }
  }
}
</script>

<style>
.lq-divider {
  position: fixed;
  top: 0;
  width: 16px;
  height: 100%;         /* we can't flex-grow (like lq-canvas and lq-discussion) because we're absolutely positioned */
  margin-left: -8px;    /* -width / 2 */
  cursor: col-resize;
  /* background-color: rgba(255, 0, 0, .1); */    /* for debugging */
}

.lq-divider + .moveable-control-box {
  display: none !important;
}
</style>
