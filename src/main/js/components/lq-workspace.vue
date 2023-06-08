<template>
  <div class="zw-workspace">
    <lq-pdf-viewer class="left-panel" v-if="fullscreen" :topic="topic" :src="fileUrl"></lq-pdf-viewer>
    <lq-canvas class="left-panel" v-else></lq-canvas>
    <lq-resizer></lq-resizer>
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
    'lq-discussion': require('./lq-discussion').default,
    'lq-resizer':    require('./lq-resizer').default
  }
}
</script>

<style>
.zw-workspace {
  display: flex;
  flex-grow: 1;
  min-height: 0;
  word-break: break-word;   /* FIXME: long attachment names (discussion panel) still don't break */
                            /* TODO: "break-word" is deprecated */
}
</style>
