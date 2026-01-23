<template>
  <div class="lq-viewport">
    <div class="zoom">{{zoomRounded}}</div>
  </div>
</template>

<script>
import dmx from 'dmx-api'

export default {

  created () {
    this.$emit('actions', [{key: 'action.save_zoom_level', handler: this.saveZoomLevel}])
  },

  props: {
    topic: {                  // the Viewport topic (dmx.ViewTopic)
      type: dmx.ViewTopic,
      required: true
    }
  },

  computed: {

    zoom () {
      return this.topic.viewProps['dmx.topicmaps.zoom']
    },

    zoomRounded () {
      return Math.round(this.zoom * 100) + '%'
    }
  },

  methods: {
    saveZoomLevel () {
      // update client state
      this.topic.setViewProp('dmx.topicmaps.zoom', this.$store.state.zoom)
      // update server state    // TODO: dispatch
      dmx.rpc.setTopicViewProps(this.$store.state.topicmap.id, this.topic.id, {
        'dmx.topicmaps.zoom': this.zoom
      })
    }
  }
}
</script>

<style>
.lq-viewport {
  border-top: 1px solid var(--danger-color);
  border-left: 1px solid var(--danger-color);
  width: 2.44rem;
  height: 2.44rem;
}

.lq-viewport .zoom {
  color: var(--danger-color);
  padding: 2px 5px;
  font-size: 0.7em;
}
</style>
