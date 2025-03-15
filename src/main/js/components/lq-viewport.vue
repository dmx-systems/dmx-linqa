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
      return Math.round(100 * this.zoom) / 100
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
/*  border-top: 3px solid black;*/
/*  border-left: 3px solid black;*/
  width: 5rem;
  height: 5rem;
  background: linear-gradient(90deg, #c05c51 .05rem, transparent .05rem), linear-gradient(360deg, #c05c51 .05rem, transparent .05rem);
  background-position: 1.225rem 1.3rem;

}

.lq-viewport .zoom {
/*  margin-top: -20px;*/
  color:#c05c51;
  padding:2px 5px;
}
</style>
