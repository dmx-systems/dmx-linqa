<template>
  <div :class="['lq-canvas-item', customClass, mode, {selected: isSelected, draggable}]" :data-id="topic.id"
      :style="style">
    <component class="item-content" :is="topic.typeUri" :topic="topic" :topic-buffer="topicBuffer" :mode="mode"
      @custom-class="setCustomClass" @action="addAction" @actions="setActions" @edit-enabled="setEditEnabled"
      @resize-style="setResizeStyle" @get-size="setGetSizeHandler" @mousedown.native="mousedown">
    </component>
    <div class="lock-icon el-icon-lock" v-if="showLock"></div>
    <div class="item-toolbar" v-if="infoMode">
      <el-button v-for="action in actions" v-if="isActionAvailable(action)" type="text" :style="buttonStyle"
          :key="action.key" @click="action.handler" @mousedown.native.stop>
        <i v-if="action.icon" :class="action.icon" :title="actionLabel(action)" :style="iconStyle"></i>
        <span v-else>{{actionLabel(action)}}</span>
      </el-button>
    </div>
  </div>
</template>

<script>
import dmx from 'dmx-api'
import lq from '../lq-globals'

export default {

  mixins: [
    require('./mixins/mode').default,
    require('./mixins/selection').default,
    require('./mixins/editable').default,
    require('./mixins/zoom').default
  ],

  props: {

    topic: {                    // the topic to render (dmx.ViewTopic)
      type: dmx.ViewTopic,
      required: true
    },

    mode: {                     // 'info'/'form'
      type: String,
      default: 'info'
    }
  },

  data () {
    return {
      topicBuffer: undefined,   // The edit buffer, available only in edit mode (dmx.ViewTopic)
      // Default configuration, can be (partially) supplied by child component      TODO: move config to canvas
      customClass: undefined,   // Custom class (String)
      actions: [                // Actions appearing in the button panel
        {key: 'action.edit',      icon: 'el-icon-edit-outline',  handler: this.edit},
        {key: 'action.lock',      icon: 'el-icon-lock',          handler: this.toggleLock},
        {key: 'action.duplicate', icon: 'el-icon-document-copy', handler: this.duplicate},
        {key: 'action.delete',    icon: 'el-icon-delete-solid',  handler: this.deleteItem}
      ],
      editEnabled: true,        // Edit button visibility (Boolean)
      resizeStyle: 'x',         // 'x'/'xy'/'none' (String)
      getSize: undefined        // Custom get-size function (Function)
    }
  },

  computed: {

    style () {
      return {
        top: `${this.y}px`,
        left: `${this.x}px`,
        width: `${this.w}px`,
        height: `${this.h}${this.h !== 'auto' ? 'px' : ''}`,
        transform: `rotate(${this.angle}deg)`
      }
    },

    x () {
      return this.topic.pos.x
    },

    y () {
      return this.topic.pos.y
    },

    w () {
      return this.formMode && lq.FORM_WIDTH || this.getSize && this.getSize().w
                                            || this.topic.viewProps['dmx.topicmaps.width']
    },

    h () {
      return this.getSize && this.getSize().h || this.resizeStyle === 'x' ? 'auto' :
                                                 this.topic.viewProps['dmx.topicmaps.height']
    },

    angle () {
      return this.topic.viewProps['linqa.angle'] || 0
    },

    locked () {
      return this.topic.children['linqa.locked']?.value
    },

    showLock () {
      return this.editable && this.locked
    },

    isEditableItem () {
      return this.isLinqaAdmin || this.isEditor && !this.locked
    },

    draggable () {
      return this.isEditableItem
    },

    topicmap () {
      return this.$store.state.topicmap
    }
  },

  methods: {

    edit () {
      // "allChildren" is required to keep the file's "Media Type". Note: Media Type is required for file rendering,
      // but it would be omitted/dropped due to "Reduced Details" as it is not an identity attribute. ### FIXDOC
      this.topicBuffer = this.topic.type.newFormModel(this.topic.clone(), true)     // allChildren=true
      this.$store.dispatch('edit', this.topic)
    },

    toggleLock () {
      this.$store.dispatch('toggleLock', this.topic)
    },

    duplicate () {
      this.$store.dispatch('duplicate', this.topic)
    },

    // Note: can't be named "delete"
    deleteItem () {
      this.$store.dispatch('delete', this.topic)
    },

    mousedown (e) {
      const inInput = e.target.tagName === 'INPUT'
      const inQuill = e.target.closest('.ql-container')
      // TODO: handle el-upload fields as well
      if (inInput || inQuill) {
        e.stopPropagation()     // prevent vue-moveable from initiating a drag
      }
    },

    isActionAvailable (action) {
      return (this.isEditableItem || action.enabledForReadOnly) && (action.key !== 'action.edit' || this.editEnabled)
                                                                && (action.key !== 'action.lock' || this.isLinqaAdmin)
    },

    actionLabel (action) {
      const key = action.key === 'action.lock' && this.locked ? 'action.unlock' : action.key
      return lq.getString(key)
    },

    setCustomClass (classname) {
      this.customClass = classname
    },

    addAction (action) {
      this.actions.push(action)
    },

    setActions (actions) {
      this.actions = actions
    },

    setEditEnabled (enabled) {
      this.editEnabled = enabled
    },

    setResizeStyle (style) {
      this.resizeStyle = style
    },

    setGetSizeHandler (handler) {
      this.getSize = handler
    }
  },

  components: {
    'linqa.document': require('./lq-document').default,
    'linqa.note': require('./lq-note').default,
    'linqa.textblock': require('./lq-textblock').default,
    'linqa.heading': require('./lq-heading').default,
    'linqa.arrow': require('./lq-arrow').default,
    'linqa.viewport': require('./lq-viewport').default
  }
}
</script>

<style>
.lq-canvas-item {
  position: absolute;
}

.lq-canvas-item.lq-arrow {
  z-index: 1 !important;                    /* Place arrows before other canvas items */
}

.lq-canvas-item.form {                      /* Place forms before arrows */
  z-index: 2 !important;
}

.lq-canvas-item.selected {                  /* Place the selected item (including button panel) in front */
  z-index: 3 !important;
}

.lq-canvas-item.draggable {
  cursor: grab;
}

.lq-canvas-item .item-toolbar {
  position: absolute;
  visibility: hidden;
  padding-top: 4px;
  padding-bottom: 12px;
}

.lq-canvas-item:hover .item-toolbar {
  visibility: visible;
}

.lq-canvas-item .lock-icon {
  position: absolute;
  right: 2px;
  bottom: 2px;
}
</style>
