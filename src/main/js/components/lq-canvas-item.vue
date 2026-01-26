<template>
  <div :class="['lq-canvas-item', {draggable}]" :data-id="topic.id" :style="style">
    <component class="item-content" :is="topic.typeUri" :topic="topic" :topic-buffer="topicBuffer" :mode="mode"
      @action="addAction" @actions="setActions" @removeAction="removeAction">
    </component>
    <el-icon class="lock-icon" v-if="showLock"><lock></lock></el-icon>
    <div :class="['item-toolbar', {flipped}]" v-if="isToolbarVisibile">
      <template v-for="action in actions" :key="action.key">
        <el-button v-if="isActionAvailable(action)" type="primary" link :style="buttonStyle" @click="action.handler"
            @mousedown.stop>
          <el-icon v-if="action.icon" :title="actionLabel(action)" :style="iconStyle">
            <component :is="actionIcon(action)"></component>
          </el-icon>
          <span v-else>{{actionLabel(action)}}</span>
        </el-button>
      </template>
    </div>
    <div class="reactions">
      <el-button v-for="(usernames, emoji) in reactions" :key="emoji" :title="displayNames(usernames)" type="info" plain
          @click="reactWithEmoji(emoji)" @mousedown.stop>
        {{emoji}} <span class="label">{{usernames.length}}</span>
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
    require('./mixins/roles').default,
    require('./mixins/viewport').default,
    require('./mixins/presentation-mode').default,
    require('./mixins/emoji-reaction').default
  ],

  inject: ['context'],

  props: {

    topic: {                    // the topic to render (dmx.ViewTopic)
      type: dmx.ViewTopic,
      required: true
    },

    mode: {                     // 'info'/'form'
      type: String,
      default: 'info'
    },

    isActive: {                 // true if the user is interacting with this item in a way that should show the toolbar
      type: Boolean,
      default: false
    }
  },

  data () {
    return {
      topicBuffer: undefined,   // The edit buffer, available only in edit mode (dmx.ViewTopic)
      // Default configuration, can be (partially) supplied by child component      TODO: move config to canvas
      actions: [                // Actions appearing in the item toolbar
        {key: 'action.edit',      icon: 'edit',          handler: this.edit},
        {key: 'action.duplicate', icon: 'document-copy', handler: this.duplicate,  enabledForEditor: true},
        {key: 'action.lock',      icon: 'lock',          handler: this.toggleLock, enabledForAdmin: true},
        {key: 'action.delete',    icon: 'delete-filled', handler: this.deleteItem}
      ]
    }
  },

  computed: {

    style () {
      return {
        top: `${this.y}px`,
        left: `${this.x}px`,
        width: `${this.w}px`,
        height: `${this.h}${this.h !== 'auto' ? 'px' : ''}`,
        transform: `rotate(${this.angle}deg)`,
        zIndex: this.z
      }
    },

    x () {
      return this.topic.pos.x
    },

    y () {
      return this.topic.pos.y
    },

    w () {
      if (this.formMode) {
        return lq.FORM_WIDTH
      } else {
        return this.topic.viewProps['dmx.topicmaps.width']
      }
    },

    h () {
      if (this.formMode) {
        return 'auto'
      } else {
        // For newly created items "height" viewprop is undefined, no "height" style attribute is generated then.
        // CSS initial "height" value is "auto". After item resize "auto" might explicitly be stored as viewprop value.
        return this.topic.viewProps['dmx.topicmaps.height']
      }
    },

    z () {
      const z = this.context.config('zIndex', this.topic)
      const raise = this.context.config('raiseOnSelect', this.topic)
      if (this.isSelected && (raise || this.formMode)) {
        // selected items appear frontmost,
        // but only if configured so, or when in form mode
        return 3
      } else if (this.formMode) {
        // forms appear above normal items, also above lines (z-index 1)
        return 2
      } else {
        return z
      }
    },

    angle () {
      return this.topic.viewProps['linqa.angle'] || 0
    },

    isToolbarVisibile () {
      return this.isActive && this.infoMode && !this.presentationMode
    },

    /**
     * Returns Object. Key: emoji char, value: array of usernames.
     */
    reactions () {
      const reactions = this.topic.children['dmx.accesscontrol.username#linqa.reaction']
      return reactions?.reduce((emojis, reaction) => {
        const emoji = reaction.assoc.value
        if (!emojis[emoji]) {
          emojis[emoji] = []
        }
        emojis[emoji].push(reaction.value)          // push username
        return emojis
      }, {})
    },

    flipped () {
      const a = Math.abs(this.angle) % 360
      return a > 90 && a < 270
    },

    locked () {
      return this.topic.children['linqa.locked']?.value
    },

    showLock () {
      return this.isAuthor && !this.presentationMode && this.locked
    },

    isEditableItem () {
      return this.isLinqaAdmin || this.isEditor && !this.locked
    },

    draggable () {
      return this.isAuthor && !this.locked
    },

    topicmap () {
      return this.$store.state.topicmap
    }
  },

  methods: {

    // 4 action handlers

    edit () {
      // "allChildren" is required to keep the file's "Media Type". Note: Media Type is required for file rendering,
      // but it would be omitted/dropped due to "Reduced Details" as it is not an identity attribute. ### FIXDOC
      this.topicBuffer = this.topic.type.newFormModel(this.topic.clone(), true)     // allChildren=true
      this.$store.dispatch('edit', this.topic)
    },

    duplicate () {
      this.$store.dispatch('duplicateMulti', [this.topic.id])
    },

    toggleLock () {
      this.$store.dispatch('setLockedMulti', {
        locked: !this.locked,
        topics: [this.topic]
      })
      // on unlock remove text selection
      if (!this.locked) {
        getSelection().empty()    // getSelection() is window method
      }
    },

    // Note: can't be named "delete"
    deleteItem () {
      this.$store.dispatch('delete', this.topic)
    },

    //

    isActionAvailable (action) {
      return (this.isEditableItem || action.enabledForUser || action.enabledForEditor && this.isEditor) &&
             (!action.enabledForAdmin || this.isLinqaAdmin)
    },

    // TODO: refactor, attach logic to action instead?
    actionLabel (action) {
      const key = action.key === 'action.lock' && this.locked ? 'action.unlock' : action.key
      return lq.getString(key)
    },

    // TODO: refactor, attach logic to action instead?
    actionIcon (action) {
      const icon = action.key === 'action.lock' && this.locked ? 'unlock' : action.icon
      return icon
    },

    // 3 event handlers

    addAction (action) {
      this.actions.unshift(action)
    },

    setActions (actions) {
      this.actions = actions
    },

    removeAction (actionKey) {
      this.actions = this.actions.filter(action => action.key !== actionKey)
    },

    //

    displayNames (usernames) {
      return usernames.map(username => lq.getDisplayName(username)).join(', ')
    }
  },

  components: {
    'linqa.document': require('./lq-document').default,
    'linqa.note': require('./lq-note').default,
    'linqa.textblock': require('./lq-textblock').default,
    'linqa.heading': require('./lq-heading').default,
    'linqa.shape': require('./lq-shape').default,
    'linqa.line': require('./lq-line').default,
    'linqa.viewport': require('./lq-viewport').default
  }
}
</script>

<style>
.lq-canvas-item {
  position: absolute;
}

.lq-canvas-item.draggable {
  cursor: grab;
}

.lq-canvas-item .item-toolbar {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 1rem;
  padding: 0rem 0.2rem;
  border: 0.05rem solid whitesmoke;
  text-align: center;
  display: inline-flex;
  justify-content: space-evenly;
}

.lq-canvas-item .item-toolbar.flipped {
  transform: rotate(180deg);
  top: -38px;     /* 38px is toolbar height */
  right: 0;
}

/* hide toolbar while dragging operation */
.lq-webclient.dragging .lq-canvas-item .item-toolbar {
  visibility: hidden;
}

.lq-canvas-item .item-toolbar .el-button {
  margin: 0;          /* Avoid zoom-dependent margin. Element Plus default for neighboring buttons is 12px */
  border-width: 0;    /* Avoid zoom-dependent border. Element Plus default border for buttons is 1px */
}

.lq-canvas-item .reactions {
  position: absolute;
  top: -18px;
  right: 0;
  white-space: nowrap;
}

.lq-canvas-item .reactions > button {
  padding: 4px 7px;
  border-radius: 12px;
}

.lq-canvas-item .lock-icon {
  position: absolute;
  right: 2px;
  bottom: 2px;
}
</style>
