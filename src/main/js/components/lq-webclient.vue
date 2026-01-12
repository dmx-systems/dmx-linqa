<template>
  <div :class="['lq-webclient', {dragging: dragMode}, dragMode]" @keyup.tab="tab">
    <lq-app-header></lq-app-header>
    <router-view></router-view>
    <iframe class="lq-download-iframe"></iframe>
  </div>
</template>

<script>
export default {

  computed: {
    dragMode () {
      return this.$store.state.dragMode
    }
  },

  methods: {
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
    'lq-app-header': require('./lq-app-header').default
  }
}
</script>

<style>
.lq-webclient {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: white;
}

.lq-webclient.dragging {
  user-select: none;    /* prevent text selection while e.g. split-panel resizer is dragged */
}

.lq-webclient.dragging.track-pan {
  cursor: move;         /* "all-scroll" would be perfect, Firefox (Mac) shows "grab" then, Chrome/Safari show "move" */
}

.lq-webclient .lq-download-iframe {
  display: none;
}
</style>
