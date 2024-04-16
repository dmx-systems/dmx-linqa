<template>
  <div :class="['lq-line', mode]">
    <svg xmlns="http://www.w3.org/2000/svg" :viewBox="viewBox" v-if="infoMode">
      <defs>
        <marker :id="markerId" markerWidth="5" markerHeight="4" refX="4" refY="2" orient="auto">
          <polygon points="0 0, 5 2, 0 4" :fill="color" />
        </marker>
      </defs>
      <line :x1="0" :y1="0" :x2="size.w" :y2="0" :stroke="color" stroke-width="6" :marker-end="markerUrl" />
    </svg>
    <template v-else>
      <div class="field">
        <div class="field-label"><lq-string>label.arrowheads</lq-string></div>
        <el-radio-group class="arrowheads" v-model="selectedArrowheads">
          <el-radio label="none"><span class="none">&#9135;&#9135;</span></el-radio>
          <el-radio label="end"><span class="end">&#767;</span></el-radio>
        </el-radio-group>
      </div>
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
    this.selectedArrowheads = this.arrowheads
  },

  data () {
    return {
      selectedArrowheads: undefined        // arrowheads selector model: 'none'/'end'
    }
  },

  computed: {

    arrowheads () {
      return this.topic.viewProps['linqa.arrowheads'] || 'none'
    },

    viewBox () {
      return `0 -${lq.CANVAS_GRID} ${this.size.w} ${this.size.h}`
    },

    markerId () {
      return `arrowhead-${this.colorAsId}`
    },

    markerUrl () {
      return this.arrowheads === 'end' && `url(#${this.markerId})`
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
      this.topic.setViewProp('linqa.arrowheads', this.selectedArrowheads)
      this.topic.setViewProp('linqa.color', this.selectedColor)                     // for storage
      this.$set(this.topic.children, 'linqa.color', {value: this.selectedColor})    // for rendering
      // Note: from Linqa 1.7 migrated arrows have no color stored, so $set() is needed
      this.$store.dispatch(this.isNew ? 'createLine' : 'updateLine', this.topic)
    },

    cancelLine () {
      this.selectedArrowheads = this.arrowheads
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

.lq-line.form .el-radio-group.arrowheads .el-radio__label > span {
  display: inline-block;
  position: relative;
  vertical-align: middle;
  font-size: 48px;
  height: 13px;
}

.lq-line.form .el-radio-group.arrowheads .el-radio__label > span.none {
  top: -23px;
}

.lq-line.form .el-radio-group.arrowheads .el-radio__label > span.end {
  transform: rotate(180deg);
  top: 30px;
}

.lq-line.form .save-button {
  margin-top: var(--field-spacing);
}
</style>
