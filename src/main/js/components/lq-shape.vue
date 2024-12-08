<template>
  <div :class="['lq-shape', shape]" :style="style">
    <lq-shape-menu v-model="shape" :topic="topic" ref="shapeMenu"></lq-shape-menu>
    <lq-color-menu v-model="color" ref="colorMenu"></lq-color-menu>
  </div>
</template>

<script>
import dmx from 'dmx-api'

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
      key: 'action.shape_style',
      icon: 'setting',
      handler: this.openShapeMenu
    })
  },

  computed: {

    shape: {
      get () {
        return this.topic.viewProps['linqa.shape_type'] || 'rectangle'
      },
      set (shape) {
        this.topic.setViewProp('linqa.shape_type', shape)       // update client state
        this.$store.dispatch('updateShapeType', this.topic)     // update server state
      }
    },

    style () {
      return ['rectangle-outline', 'ellipse-outline'].includes(this.shape) ? this.borderColor : this.backgroundColor
    }
  },

  methods: {
    openShapeMenu () {
      this.$store.dispatch('select', [this.topic])      // programmatic selection
      this.$refs.shapeMenu.open()
    }
  },

  components: {
    'lq-shape-menu': require('./lq-shape-menu').default
  }
}
</script>

<style>
.lq-shape {
  height: 100%;
}

.lq-shape.ellipse,
.lq-shape.ellipse-outline {
  border-radius: 50%;
}

.lq-shape.rectangle-outline,
.lq-shape.ellipse-outline {
  box-sizing: border-box;
  border: 6px solid;
}
</style>
