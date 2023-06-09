<template>
  <div :class="['lq-webclient', {dragging: isDragging}]" @mousedown="mousedown" @mouseup="mouseup" @keyup.tab="tab">
    <lq-header></lq-header>
    <router-view></router-view>
    <iframe class="lq-download-iframe"></iframe>
  </div>
</template>

<script>
export default {

  mixins: [
    require('./mixins/dragging').default
  ],

  data() {
    return {
      isPanning: false,     // true while canvas pan is in progress
      panPos: undefined     // temporary mouse pos while canvas pan
    }
  },

  computed: {

    pan () {
      return this.$store.state.pan
    },

    isDragging () {
      return this.$store.state.isDragging
    }
  },

  methods: {

    mousedown (e) {
      if (e.target.classList.contains('lq-canvas')) {
        this.$el.addEventListener('mousemove', this.mousemove)
        this.panPos = {
          x: e.clientX,
          y: e.clientY
        }
      }
    },

    mousemove (e) {
      this.$store.dispatch('setViewport', {
        pan: {
          x: this.pan.x + e.clientX - this.panPos.x,
          y: this.pan.y + e.clientY - this.panPos.y
        }
      })
      this.panPos.x = e.clientX
      this.panPos.y = e.clientY
      if (!this.isPanning) {
        this.isPanning = true
        this.dragStart()
      }
    },

    mouseup (e) {
      if (this.panPos) {
        this.$el.removeEventListener('mousemove', this.mousemove)
        if (this.isPanning) {
          // stop panning
          this.isPanning = false
          this.dragStop()
        }
        this.panPos = undefined
      }
    },

    tab () {
      // auto-pan canvas when focus outside viewport while tabbing
      const scrollTop = document.scrollingElement.scrollTop
      if (scrollTop > 0) {
        document.scrollingElement.scrollTop = 0     // reset browser auto-scroll
        this.$store.dispatch('setViewport', {       // ... and compensate with panning
          pan: {
            x: this.pan.x,
            y: this.pan.y - scrollTop
          },
          transition: true
        })
      }
    }
  },

  components: {
    'lq-header': require('./lq-header').default
  }
}
</script>

<style>
.lq-webclient {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.lq-webclient.dragging {
  user-select: none;
}

.lq-webclient .lq-download-iframe {
  display: none;
}
</style>
