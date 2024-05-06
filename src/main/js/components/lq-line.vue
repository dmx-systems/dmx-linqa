<template>
  <div :class="['lq-line']">
    <svg :viewBox="viewBox">
      <defs>
        <marker :id="markerId" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto-start-reverse">
          <polygon points="0 0, 5 2, 0 4" :fill="color" />
        </marker>
      </defs>
      <line :x1="0" :y1="0" :x2="size.w" :y2="0" :stroke="color" stroke-width="6" :marker-start="markerStartUrl"
        :marker-end="markerEndUrl" />
    </svg>
    <lq-color-menu v-model="color" palette="foreground" ref="colorMenu"></lq-color-menu><!--
    --><lq-arrowheads-menu v-model="arrowheads" ref="arrowheadsMenu"></lq-arrowheads-menu>
  </div>
</template>

<script>
import dmx from 'dmx-api'
import lq from '../lq-globals'

export default {

  mixins: [
    require('./mixins/color-model').default
  ],

  props: {
    topic: {                  // the topic to render
      type: dmx.ViewTopic,
      required: true
    }
  },

  created () {
    this.$emit('removeAction', 'action.edit')
    this.$emit('action', {
      key: 'action.arrowheads',
      icon: 'el-icon-back',
      handler: this.openArrowheadsMenu
    })
    this.$emit('action', {
      key: 'action.color',
      icon: 'el-icon-s-open',
      handler: this.openColorMenu
    })
  },

  computed: {

    arrowheads: {
      get () {
        return this.topic.viewProps['linqa.arrowheads'] || 'none'
      },
      set (arrowheads) {
        this.topic.setViewProp('linqa.arrowheads', arrowheads)      // update client state
        this.$store.dispatch('updateArrowheads', this.topic)        // update server state
      }
    },

    viewBox () {
      return `0 -${lq.CANVAS_GRID} ${this.size.w} ${this.size.h}`
    },

    size () {
      return {
        w: this.topic.viewProps['dmx.topicmaps.width'],
        h: 2 * lq.CANVAS_GRID - 2
      }
    },

    markerId () {
      return `arrowhead-${this.colorAsId}`
    },

    markerUrl () {
      return `url(#${this.markerId})`
    },

    markerStartUrl () {
      return ['start', 'start-end'].includes(this.arrowheads) && this.markerUrl
    },

    markerEndUrl () {
      return ['end', 'start-end'].includes(this.arrowheads) && this.markerUrl
    }
  },

  methods: {

    openColorMenu () {
      this.$store.dispatch('select', [this.topic])      // programmatic selection
      this.$refs.colorMenu.open()
    },

    openArrowheadsMenu () {
      this.$store.dispatch('select', [this.topic])      // programmatic selection
      this.$refs.arrowheadsMenu.open()
    }
  },

  components: {
    'lq-color-menu': require('./lq-color-menu').default,
    'lq-arrowheads-menu': require('./lq-arrowheads-menu').default
  }
}
</script>

<style>
.lq-line svg {
  overflow: visible;
}
</style>
