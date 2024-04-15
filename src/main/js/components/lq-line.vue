<template>
  <div :class="['lq-line', mode]">
    <svg xmlns="http://www.w3.org/2000/svg" :viewBox="viewBox" v-if="infoMode">
      <defs>
        <marker :id="markerId" markerWidth="6" markerHeight="5" refX="5" refY="2.5" orient="auto">
          <polygon points="0 0, 6 2.5, 0 5" :fill="color" />
        </marker>
      </defs>
      <line :x1="0" :y1="0" :x2="size.w" :y2="0" :stroke="color" stroke-width="6" :marker-end="markerUrl" />
    </svg>
    <template v-else>
      <lq-color-selector v-model="selectedColor" palette="foreground"></lq-color-selector>
      <el-button class="save-button" type="primary" size="medium" @click="save">
        <lq-string>action.submit</lq-string>
      </el-button>
      <el-button size="medium" @click="cancelLine">
        <lq-string>action.cancel</lq-string>
      </el-button>
    </template>
  </div>
</template>

<script>
import dmx from 'dmx-api'
import lq from '../lq-globals'

export default {

  mixins: [
    require('./mixins/editable').default,
    require('./mixins/color-selector').default
  ],

  created () {
    this.$emit('get-size', () => this.size)
  },

  computed: {

    viewBox () {
      return `0 -${lq.CANVAS_GRID} ${this.size.w} ${this.size.h}`
    },

    markerId () {
      return `arrowhead-${this.colorAsId}`
    },

    markerUrl () {
      return `url(#${this.markerId})`
    },

    size () {
      return {
        w: this.topic.viewProps['dmx.topicmaps.width'],
        h: 2 * lq.CANVAS_GRID - 2
      }
    }
  },

  methods: {

    save () {
      this.topic.setViewProp('linqa.color', this.selectedColor)            // for storage
      this.topic.children['linqa.color'] = {value: this.selectedColor}     // for rendering
      // this.topic.setViewProp('linqa.shape_type', this.selectedShape)    // TODO
      //
      this.$store.dispatch(this.isNew ? 'createLine' : 'updateLine', this.topic)
    },

    cancelLine () {
      // this.selectedShape = this.shape  // TODO
      this.cancelColor()     // from color-selector mixin
    }
  },

  components: {
    'lq-color-selector': require('./lq-color-selector').default
  }
}
</script>

<style>
.lq-line.info svg {
  overflow: visible;
}

.lq-line.form {
  background-color: var(--background-color);
  padding: 12px;
}

.lq-line.form .save-button {
  margin-top: var(--field-spacing);
}
</style>
