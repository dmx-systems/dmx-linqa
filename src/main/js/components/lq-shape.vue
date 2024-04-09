<template>
  <div :class="['lq-shape', mode]" :style="style">
    <template v-if="infoMode">
      Das ist eine Form 😊
    </template>
    <template v-else>
      <lq-color-selector v-model="selectedColor"></lq-color-selector>
      <el-button class="save-button" type="primary" size="medium" @click="save">
        <lq-string>action.submit</lq-string>
      </el-button>
      <el-button size="medium" @click="doCancel">
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

  updated () {
    // this.$store.dispatch('updateControlBox')   // TODO: needed? Move to mixin?
  },

  props: {

    topic: {                          // the Note topic to render (dmx.ViewTopic)
      type: dmx.ViewTopic,
      required: true
    },

    topicBuffer: dmx.ViewTopic,       // the edit buffer (dmx.ViewTopic)

    mode: {                           // 'info'/'form'
      type: String,
      default: 'info'
    }
  },

  data () {
    return {
    }
  },

  computed: {

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
      this.topic.setViewProp('linqa.color', this.selectedColor)            // persistence
      this.topic.children['linqa.color'] = {value: this.selectedColor}     // view
      let action
      if (this.isNew) {
        action = 'createShape'
      } else {
        action = 'storeTopicViewProps'
        // transfer edit buffer to topic model
        // TODO?
      }
      this.$store.dispatch(action, this.topic)
    }
  },

  components: {
    'lq-color-selector': require('./lq-color-selector').default
  }
}
</script>

<style>
</style>
