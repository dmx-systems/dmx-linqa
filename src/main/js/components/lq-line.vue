<template>
  <div :class="['lq-line', lineStyle]">
    <svg :viewBox="viewBox">
      <defs>
        <marker :id="markerId" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto-start-reverse">
          <polygon points="0 0, 5 2, 0 4" :fill="color" />
        </marker>
      </defs>
      <line :x1="0" :y1="0" :x2="size.w" :y2="0" :stroke="color" stroke-width="6" :marker-start="markerStartUrl"
        :marker-end="markerEndUrl" />
    </svg>
    <lq-line-menu @arrowheads="setArrowheads" @line-style="setLineStyle" ref="lineMenu"></lq-line-menu><!--
    --><lq-color-menu v-model="color" palette="foreground" ref="colorMenu"></lq-color-menu>
  </div>
</template>

<script>
import dmx from 'dmx-api'
import lq from '../lq-globals'

export default {

  mixins: [
    require('./mixins/color-menu').default
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
      key: 'action.line_style',
      icon: 'fa-cog',
      handler: this.openLineMenu
    })
  },

  computed: {

    arrowheads: {
      get () {
        return this.topic.viewProps['linqa.arrowheads'] || 'none'
      },
      set (arrowheads) {
        this.$store.dispatch('updateArrowheads', {topic: this.topic, arrowheads})
      }
    },

    lineStyle: {
      get () {
        return this.topic.viewProps['linqa.line_style'] || 'none'
      },
      set (lineStyle) {
        this.$store.dispatch('updateLineStyle', {topic: this.topic, lineStyle})
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

    openLineMenu () {
      this.$store.dispatch('select', [this.topic])      // programmatic selection
      this.$refs.lineMenu.open()
    },

    setArrowheads (arrowheads) {
      this.arrowheads = arrowheads
    },

    setLineStyle (lineStyle) {
      this.lineStyle = lineStyle
    }
  },

  components: {
    'lq-line-menu': require('./lq-line-menu').default
  }
}
</script>

<style>
.lq-line svg {
  overflow: visible;
}

.lq-line.dotted {
  stroke-dasharray: 6;
}

.lq-line.dashed {
  stroke-dasharray: 14 12;
}
</style>
