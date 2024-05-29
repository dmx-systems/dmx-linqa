import lq from '../../lq-globals'

let APP_HEADER_HEIGHT

export default {

  mixins: [
    require('./dragging').default
  ],

  mounted () {
    APP_HEADER_HEIGHT = document.querySelector('.lq-app-header').clientHeight
  },

  methods: {
    // 3 vue-selecto event handlers

    // "Selecto" passes a custom "dragStart" event. Regarding cancelling it provides 3 functions:
    // - stop()           -- stops entire "selecto" logic both, drag selection + deselection
    // - preventDrag()    -- prevents drag selection but still allows deselection
    // - preventDefault() -- alias of native event's preventDefault()?
    onDragSelectStart (e) {
      if (e.inputEvent.target === this.$refs.canvas) {
        if (e.inputEvent.shiftKey) {
          // console.log('onDragSelectStart() -> STARTING DRAG SELECTION and PREVENT CANVAS PAN')
          e.inputEvent.stopImmediatePropagation()
        } else {
          // console.log('onDragSelectStart() -> PREVENT DRAG SELECTION (shift key not pressed)')
          // Prevent drag selection but still allow *deselection* (click on canvas) which is also part
          // of "selecto" logic. e.stop() on the other hand would stop the entire "selecto" logic.
          e.preventDrag()
        }
      } else {
        const target = e.inputEvent.target
        const element = this.$refs.selecto.getSelectableElements().find(e => e.contains(target))
        if (element) {
          if (this.$refs.moveable.isMoveableElement(target) || this.targets.includes(element)) {
            /* console.log('onDragSelectStart() -> PREVENT DRAG SELECTION (clicked on already selected item)',
              this.$refs.moveable.isMoveableElement(target), this.targets.includes(element),
              element !== undefined) */
            // Stop "selecto" logic (drag selection + deselection) if we've clicked
            // 1) a multi-selection in order to drag it (for a multi-selection isMoveableElement() is true), OR
            // 2) a selected item in order to do a text-selection drag in form mode
            e.stop()
          } else {
            // console.log('onDragSelectStart() -> SELECT ITEM', element.dataset.id)
          }
        } else {
          // console.log('onDragSelectStart() -> PREVENT ITEM SELECTION (clicked element is not selectable)')
          e.stop()
        }
      }
    },

    onSelect (e) {
      // console.log('onSelect()')
      this.$store.dispatch('updateSelection', {
        addTopics: e.added.map(el => el.__vue__.topic),
        removeTopicIds: e.removed.map(el => Number(el.dataset.id))
      })
      setTimeout(() => {    // Vue.nextTick() does not work here
        this.positionGroupToolbar()
      }, 100)
    },

    onSelectEnd (e) {
      // console.log('onSelectEnd()', e.isDragStart)
      if (e.isDragStart) {
        e.inputEvent.preventDefault()
        setTimeout(() => {
          this.$refs.moveable.dragStart(e.inputEvent)
        })
      }
    },

    // 11 vue-moveable event handlers

    // "Moveable" passes a custom "dragStart" event. Regarding cancelling it provides 3 functions:
    // - stopAble() -- stops the current "able", e.g. you can stop a "draggable" behavior but not a "pinchable" behavior
    // - stopDrag() -- stops all "able" behaviors. stopDrag() is more radical than stopAble()
    // - stop()     -- not in API docs, apparently an alias for stopAble()
    onDragStart (e) {
      const parent = e.inputEvent.target.closest('button, input, label[role="radio"], .ql-editor')
      if (parent) {
        // console.log('onDragStart() -> PREVENT ITEM DRAG (clicked on input element)', e.target.dataset.id)
        e.stopDrag()
      } else {
        // console.log('onDragStart() -> STARTING ITEM DRAG', e.target.dataset.id)
        const topic = this.findTopic(e.target)
        if (topic) {
          this.dragStartPos = {[topic.id]: topic.pos}
        } else {
          // FIXME: this should never happen. When deselecting an item or selecting a different one a
          // superfluous start-item-drag is triggered together with intended start-canvas-pan or start-item-drag
          // (for the previously selected item). This happens only on mobile. Timing is an issue here.
          // console.warn(`onDragStart() -> ABORT ITEM DRAG (item ${e.target.dataset.id} not in selection)`)
          e.stopDrag()
        }
      }
    },

    onDrag (e) {
      // console.log('onDrag()')
      this.config('moveHandler')(this.findTopic(e.target), e.dist[0], e.dist[1])
      if (e.isFirstDrag) {
        this.dragStart('drag-item')
      }
    },

    onDragEnd (e) {
      // console.log('onDragEnd()')
      this.$store.dispatch('storeTopicPos', this.findTopic(e.target))
      this.dragStop()
    },

    onClickGroup (e) {
      this.$refs.selecto.clickTarget(e.inputEvent, e.inputTarget)
    },

    onDragGroupStart (e) {
      // console.log('onDragGroupStart()')
      // remembers start positions
      const p = {}
      e.targets.forEach(el => {
        const topic = this.findTopic(el)
        p[topic.id] = topic.pos
      })
      this.dragStartPos = p
    },

    onDragGroup (e) {
      // console.log('onDragGroup()')
      e.targets.forEach(el => {
        const topic = this.findTopic(el)
        this.config('moveHandler', topic)(topic, e.dist[0], e.dist[1])
        this.positionGroupToolbar()
      })
    },

    onDragGroupEnd (e) {
      // console.log('onDragGroupEnd()')
      const topicCoords = e.targets.map(el => {
        const topic = this.findTopic(el)
        const pos = topic.pos
        return {
          topicId: topic.id,
          x: pos.x,
          y: pos.y
        }
      })
      this.$store.dispatch('storeTopicCoords', topicCoords)
    },

    onResize (e) {
      // console.log('onResize', e.direction)
      this.setSize(e.target, e.width, this.autoHeight(e, e.height))
    },

    onResizeEnd (e) {
      // console.log('onResizeEnd', e.isDrag, e.lastEvent?.direction, e.lastEvent?.dist)
      if (e.isDrag) {     // mouse actually moved between mousedown and mouseup, only then "lastEvent" is available
        const topic = this.findTopic(e.target)
        // We only snap-to-grid on resize-end. While resize is in progress it does not work properly (the mouse is
        // no longer over the component when width is changed programmatically?).
        const width = lq.snapToGrid(topic.getViewProp('dmx.topicmaps.width'))
        const height = lq.snapToGrid(topic.getViewProp('dmx.topicmaps.height'))
        this.setSize(e.target, width, this.autoHeight(e.lastEvent, height))
        this.$store.dispatch('storeTopicSize', topic)
      }
    },

    onRotate ({target, rotate}) {
      const angle = Math.round(rotate / 5) * 5          // rotate in 5 deg steps
      target.style.transform = `rotate(${angle}deg)`;   // view update not strictly required but improves rendering
      this.findTopic(target).setViewProp('linqa.angle', angle)     // update model
    },

    onRotateEnd (e) {
      this.$store.dispatch('storeTopicAngle', this.findTopic(e.target))
    },

    // 6 vue-moveable event handlers (canvas panning + pinching)

    // "Moveable" passes a custom "dragStart" event. Regarding cancelling it provides 3 functions:
    // - stopAble() -- stops the current "able", e.g. you can stop a "draggable" behavior but not a "pinchable" behavior
    // - stopDrag() -- stops all "able" behaviors. stopDrag() is more radical than stopAble()
    // - stop()     -- not in API docs, apparently an alias for stopAble()
    onPanStart (e) {
      if (e.inputEvent.target !== this.$refs.canvas) {
        // console.log('onPanStart() -> PREVENT CANVAS PAN (not clicked on canvas)', e.inputEvent.touches?.length)
        if (e.inputEvent.touches?.length === 2) {
          // Only stop the "draggable" (which handles canvas panning), NOT the "pinchable" (as handled by the same
          // Moveable instance). So the current mousedown/touchstart event can still invoke a "pinch" event. Calling
          // e.stopDrag() on the other hand would stop invocation of *all* the drag events, including "pinch".
          e.stopAble()
        } else {
          // Cancel entire gesture, otherwise the search input field will not receive focus anymore (default prevented)
          e.stopDrag()
        }
      } else {
        // console.log('onPanStart() -> STARTING CANVAS PAN')
      }
    },

    onPan (e) {
      // console.log('onPan()', e.isFirstDrag)
      this.$store.dispatch('setViewport', {
        pan: {
          x: this.pan.x + e.delta[0],
          y: this.pan.y + e.delta[1]
        }
      })
      // FIXME: avoid mouse hover effects while panning over e.g. discussion panel, app header, or an open menu
      /* if (e.isFirstDrag) {     // TODO: needed?
        this.dragStart()
      } */
    },

    onPanEnd (e) {
      // console.log('onPanEnd()')
      // this.dragStop()          // TODO: needed?
    },

    onPinchStart (e) {
      console.log('onPinchStart()', e.inputEvent.target === this.$refs.canvas)
      this.startZoom = this.zoom
    },

    onPinch (e) {
      console.log('onPinch()' /*, e.inputEvent.scale, e */)
      this.setZoom(this.startZoom * e.inputEvent.scale, e.clientX, e.clientY - APP_HEADER_HEIGHT)
    },

    onPinchEnd (e) {
      console.log('onPinchEnd()')
    },

    //

    wheelZoom (e) {
      // console.log('wheelZoom', e)
      this.setZoom(this.zoom - .003 * e.deltaY, e.clientX, e.clientY - APP_HEADER_HEIGHT)
    },

    trackStart ({pageX: initialPageX, pageY: initialPageY}) {
      // console.log('trackStart', initialPageX, initialPageY)
      const {addEventListener, removeEventListener} = this.$refs.canvas
      let dx, dy, i

      const track = ({pageX, pageY}) => {
        dx = pageX - initialPageX
        dy = pageY - initialPageY
        // console.log('track', dx, dy, i)
        if (!i) {
          i = setInterval(pan, 50)
        }
      }

      const pan = () => {
        this.$store.dispatch('setViewport', {
          pan: {
            x: this.pan.x + 0.4 * dx,
            y: this.pan.y + 0.4 * dy
          }
        })
      }

      const trackStop = () => {
        // console.log('trackStop')
        removeEventListener('mousemove', track)
        removeEventListener('mouseup',   trackStop)
        clearInterval(i)
        this.dragStop()
      }

      addEventListener('mousemove', track)
      addEventListener('mouseup', trackStop)
      this.dragStart('track-pan')
    },

    autoHeight (e, height) {
      return e.direction[1] === 0 && this.config('autoHeight') ? 'auto' : height    // detect "east"-handler
    },

    transitionend () {
      this.$store.dispatch('transitionEnd')
    },

    onEnter () {
      this.groupHover = true
    },

    onLeave () {
      this.groupHover = false
    }
  }
}
