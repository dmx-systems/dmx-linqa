<template>
  <div :class="['lq-webclient', {dragging: isDragging}]" @keyup.tab="tab">
    <lq-header></lq-header>
    <router-view></router-view>
    <iframe class="lq-download-iframe"></iframe>
  </div>
</template>

<script>
export default {

  computed: {
    isDragging () {
      return this.$store.state.isDragging
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
  user-select: none;      /* prevent text selection while e.g. split-resizer is dragged */
}

.lq-webclient .lq-download-iframe {
  display: none;
}
</style>
