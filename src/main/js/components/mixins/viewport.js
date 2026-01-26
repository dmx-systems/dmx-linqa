import lq from '../../lq-globals'

export default {

  computed: {

    viewportStyle () {
      return {
        'transform': `translate(${this.pan.x}px, ${this.pan.y}px) scale(${this.zoom})`,
        'transform-origin': 'top left'
      }
    },

    // zoom compensation
    buttonStyle () {
      return {
        'font-size': `${14 / this.zoom}px`      // "14" matches --primary-font-size (see App.vue)
      }
    },

    // zoom compensation
    iconStyle () {
      return {
        'font-size': `${22 / this.zoom}px`,     // icons need to be bigger than text
        'margin': `${5 / this.zoom}px ${10 / this.zoom}px`,
      }
    },

    pan () {
      return this.$store.state.pan
    },

    zoom () {
      return this.$store.state.zoom
    }
  },

  methods: {
    setZoom (zoom, cx, cy, transition) {
      // ignore if not in range
      if (zoom < lq.ZOOM_MIN) {
        return
      }
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
    }
  }
}
