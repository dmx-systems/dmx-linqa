<template>
  <div class="lq-workspace">
    <lq-pdf-viewer class="left-panel" v-if="fullscreen" :topic="topic" :src="fileUrl"></lq-pdf-viewer>
    <lq-canvas class="left-panel" v-else></lq-canvas>
    <lq-discussion class="right-panel"></lq-discussion>
  </div>
</template>

<script>
export default {

  mixins: [
    require('./mixins/doc-util').default,
    require('./mixins/selection').default
  ],

  computed: {

    topic () {
      return this.selectedTopic
    },

    fullscreen () {
      return this.$store.state.fullscreen
    }
  },

  components: {
    'lq-canvas':     require('./lq-canvas').default,
    'lq-discussion': require('./lq-discussion').default
  }
}
</script>

<style>
.lq-workspace {
  display: flex;
  flex-grow: 1;
  position: relative;       /* height of child lq-resizer must relate to lq-workspace height, not body height */
  min-height: 0;
  word-break: break-word;   /* TODO: "break-word" is deprecated */
}
</style>
