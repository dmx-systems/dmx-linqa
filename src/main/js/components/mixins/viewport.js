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
      // console.log('####ZOOM', this.zoom)
      return {
        // "14" matches --primary-font-size (see App.vue)
      }
    },

    // zoom compensation
    iconStyle () {
      return {
        'font-size': `${1.4 / this.zoom}rem`,     // icons need to be bigger than text    // TODO 18px, 24px for mobile
        'margin': `${0.4 / this.zoom}vh ${0.9 / this.zoom}vw`,
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
