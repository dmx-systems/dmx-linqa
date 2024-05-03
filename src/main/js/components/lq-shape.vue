<template>
  <div :class="['lq-shape', shape, mode]" :style="style">
    <template v-if="formMode">
      <div class="field">
        <div class="field-label"><lq-string>item.shape</lq-string></div>
        <el-radio-group class="shape" v-model="selectedShape">
          <el-radio label="rectangle"><span class="rectangle" :style="radioStyle"></span></el-radio>
          <el-radio label="ellipse"><span class="ellipse" :style="radioStyle"></span></el-radio>
        </el-radio-group>
      </div>
      <el-button class="save-button" type="primary" size="medium" @click="save">
        <lq-string>action.submit</lq-string>
      </el-button>
      <el-button size="medium" @click="cancelShape">
        <lq-string>action.cancel</lq-string>
      </el-button>
    </template>
    <lq-color-menu v-model="color" ref="colorMenu"></lq-color-menu>
    <lq-shape-menu v-model="shape" :color="color" ref="shapeMenu"></lq-shape-menu>
  </div>
</template>

<script>
import dmx from 'dmx-api'

export default {

  mixins: [
    require('./mixins/editable').default,
    require('./mixins/color-model').default,
    require('./mixins/cancel').default   // TODO: drop it
  ],

  created () {
    this.selectedShape = this.shape
    this.$emit('action', {
      key: 'action.shape',
      icon: 'el-icon-star-off',
      handler: this.openShapeMenu
    })
    this.$emit('action', {
      key: 'action.color',
      icon: 'el-icon-brush',
      handler: this.openColorMenu
    })
  },

  data () {
    return {
      selectedShape: undefined        // shape selector model: 'rectangle'/'ellipse'
    }
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
      if (this.infoMode) {
        return {
          'background-color': this.color
        }
      }
    },

    radioStyle () {
      return {
        'background-color': this.color
      }
    }
  },

  methods: {

    openColorMenu () {
      this.$store.dispatch('select', [this.topic])      // programmatic selection
      this.$refs.colorMenu.open()
    },

    openShapeMenu () {
      this.$store.dispatch('select', [this.topic])      // programmatic selection
      this.$refs.shapeMenu.open()
    },

    // TODO: drop it
    save () {
      this.topic.setViewProp('linqa.shape_type', this.selectedShape)
      this.$store.dispatch(this.isNew ? 'createShape' : 'updateShape', this.topic)
    },

    // TODO: drop it
    cancelShape () {
      this.selectedShape = this.shape
      this.cancel()     // from cancel mixin
    }
  },

  components: {
    'lq-color-menu': require('./lq-color-menu').default,
    'lq-shape-menu': require('./lq-shape-menu').default
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

/* TODO: drop form mode style */

.lq-shape.form {
  background-color: var(--background-color);
  padding: 12px;
}

.lq-shape.form .el-radio-group.shape .el-radio__label > span {
  display: inline-block;
  vertical-align: middle;
  width: 40px;
  height: 30px;
  border: 1px dashed var(--highlight-color);
}

.lq-shape.form .el-radio-group.shape .el-radio__label > span.rectangle {
  width: 36px;
  height: 27px;
}

.lq-shape.form .el-radio-group.shape .el-radio__label > span.ellipse {
  border-radius: 50%;
}

.lq-shape.form .save-button {
  margin-top: var(--field-spacing);
}
</style>
