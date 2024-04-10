<template>
  <div :class="['lq-shape', shape, mode]" :style="style">
    <template v-if="formMode">
      <div class="field">
        <div class="field-label"><lq-string>item.shape</lq-string></div>
        <el-radio-group v-model="selectedShape">
          <el-radio label="rectangle">Rectangle</el-radio>
          <el-radio label="ellipse">Ellipse</el-radio>
        </el-radio-group>
      </div>
      <lq-color-selector v-model="selectedColor"></lq-color-selector>
      <el-button class="save-button" type="primary" size="medium" @click="save">
        <lq-string>action.submit</lq-string>
      </el-button>
      <el-button size="medium" @click="cancelShape">
        <lq-string>action.cancel</lq-string>
      </el-button>
    </template>
  </div>
</template>

<script>
import dmx from 'dmx-api'

export default {

  mixins: [
    require('./mixins/mode').default,
    require('./mixins/color-selector').default
  ],

  created () {
    this.$emit('resize-style', 'xy')
    this.selectedShape = this.shape
  },

  updated () {
    this.$store.dispatch('updateControlBox')    // TODO: move to mixin?
  },

  props: {

    topic: {                          // the Note topic to render (dmx.ViewTopic)
      type: dmx.ViewTopic,
      required: true
    },

    mode: {                           // 'info'/'form'
      type: String,
      default: 'info'
    }
  },

  data () {
    return {
      selectedShape: undefined        // shape selector model, 'rectangle'/'ellipse'
    }
  },

  computed: {

    shape () {
      return this.topic.viewProps['linqa.shape'] || 'rectangle'
    },

    style () {
      if (this.infoMode) {
        return {
          'background-color': this.color
        }
      }
    },

    // TODO: factor out as a mixin? Copies in lq-note.vue, lq-document.vue, lq-textblock.vue
    isNew () {
      return this.topic.id < 0
    }
  },

  methods: {

    save () {
      this.topic.setViewProp('linqa.shape', this.selectedShape)
      this.topic.setViewProp('linqa.color', this.selectedColor)            // for storage
      this.topic.children['linqa.color'] = {value: this.selectedColor}     // for rendering
      //
      this.$store.dispatch(this.isNew ? 'createShape' : 'updateShape', this.topic)
    },

    cancelShape () {
      this.selectedShape = this.shape
      this.cancelColor()     // from color-selector mixin
    }
  },

  components: {
    'lq-color-selector': require('./lq-color-selector').default
  }
}
</script>

<style>
.lq-shape {
  height: 100%;
}

.lq-shape.info.ellipse {
  border-radius: 50%;
}

.lq-shape.form {
  background-color: var(--background-color);
  padding: 12px;
}

.lq-shape.form .save-button {
  margin-top: var(--field-spacing);
}
</style>
