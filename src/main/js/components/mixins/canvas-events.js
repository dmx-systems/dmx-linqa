import Hammer from 'hammerjs'
import lq from '../../lq-globals'

const TRACK_PAN_SPEED = 0.2
const LOG = false
let APP_HEADER_HEIGHT

export default {

  mixins: [
    require('./dragging').default
  ],

  mounted () {
    APP_HEADER_HEIGHT = document.querySelector('.lq-app-header').clientHeight
    //
    const c = this.$refs.canvas
    LOG && console.log('CANVAS MOUNTED -> create Hammer', c)
    const h = new Hammer.Manager(c, {
      recognizers: [[Hammer.Pinch]]
    })
    h.on('pinchstart', this.onPinchStart)
    h.on('pinchmove', this.onPinch)
    h.on('pinchend', this.onPinchEnd)
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
          LOG && console.log('onDragSelectStart() -> STARTING DRAG SELECTION and PREVENT CANVAS PAN')
          e.inputEvent.stopImmediatePropagation()
        } else {
          // LOG && console.log('onDragSelectStart() -> PREVENT DRAG SELECTION (shift key not pressed)')
          // Prevent drag selection but still allow *deselection* (click on canvas) which is also part
          // of "selecto" logic. e.stop() on the other hand would stop the entire "selecto" logic.
          e.preventDrag()
        }
      } else {
        const target = e.inputEvent.target
        const element = this.$refs.selecto.getSelectableElements().find(e => e.contains(target))
        if (element) {
          if (this.$refs.moveable.isMoveableElement(target) || this.targets.includes(element)) {
            /* LOG && console.log('onDragSelectStart() -> PREVENT DRAG SELECTION (clicked on already selected item)',
              this.$refs.moveable.isMoveableElement(target), this.targets.includes(element),
              element !== undefined) */
            // Stop "selecto" logic (drag selection + deselection) if we've clicked
            // 1) a multi-selection in order to drag it (for a multi-selection isMoveableElement() is true), OR
            // 2) a selected item in order to do a text-selection drag in form mode
            e.stop()
          } else {
            // LOG && console.log('onDragSelectStart() -> SELECT ITEM', element.dataset.id)
          }
        } else {
          LOG && console.log('onDragSelectStart() -> PREVENT ITEM SELECTION (clicked element is not selectable)')
          e.stop()
        }
      }
    },

    onSelect (e) {
      // LOG && console.log('onSelect()')
      this.$store.dispatch('updateSelection', {
        addTopics: e.added.map(el => this.$store.state.topicmap.getTopic(el.dataset.id)),
        removeTopicIds: e.removed.map(el => Number(el.dataset.id))
      })
    },

    onSelectEnd (e) {
      // LOG && console.log('onSelectEnd()', e.isDragStart)
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
      if (e.inputEvent.touches?.length === 2) {
        // 2 fingers never drag an item (but initiate pan and pinch)
        LOG && console.log('onDragStart() -> PREVENT ITEM DRAG (2 finger gesture)')
        e.stopDrag()
      } else {
        const parent = e.inputEvent.target.closest('button, input, label[role="radio"], .ql-editor')
        if (parent) {
          LOG && console.log('onDragStart() -> PREVENT ITEM DRAG (clicked on input element)', e.target.dataset.id)
          e.stopDrag()
        } else {
          LOG && console.log('onDragStart() -> STARTING ITEM DRAG', e.target.dataset.id)
          const topic = this.findTopic(e.target)
          if (topic) {
            this.dragStartPos = {[topic.id]: topic.pos}
          } else {
            // FIXME: this should never happen. When deselecting an item or selecting a different one a
            // superfluous start-item-drag is triggered together with intended start-canvas-pan or start-item-drag
            // (for the previously selected item). This happens only on mobile. Timing is an issue here.
            console.warn(`onDragStart() -> ABORT ITEM DRAG (item ${e.target.dataset.id} not in selection)`)
            e.stopDrag()
          }
        }
      }
    },

    onDrag (e) {
      // LOG && console.log('onDrag()')
      this.config('moveHandler')(this.findTopic(e.target), e.dist[0], e.dist[1])
      if (e.isFirstDrag) {
        this.dragStart('drag-item')
      }
    },

    onDragEnd (e) {
      LOG && console.log('onDragEnd()')
      this.$store.dispatch('storeTopicPos', this.findTopic(e.target))
      this.dragStop()
    },

    onClickGroup (e) {
      this.$refs.selecto.clickTarget(e.inputEvent, e.inputTarget)
    },

    onDragGroupStart (e) {
      LOG && console.log('onDragGroupStart()')
      // remembers start positions
      const p = {}
      e.targets.forEach(el => {
        const topic = this.findTopic(el)
        p[topic.id] = topic.pos
      })
      this.dragStartPos = p
    },

    onDragGroup (e) {
      LOG && console.log('onDragGroup()')
      e.targets.forEach(el => {
        const topic = this.findTopic(el)
        this.config('moveHandler', topic)(topic, e.dist[0], e.dist[1])
        this.$store.dispatch('positionGroupToolbar')
      })
    },

    onDragGroupEnd (e) {
      LOG && console.log('onDragGroupEnd()')
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
      LOG && console.log('onResize', e.direction)
      this.setSize(e.target, e.width, this.autoHeight(e, e.height))
    },

    onResizeEnd (e) {
      LOG && console.log('onResizeEnd', e.isDrag, e.lastEvent?.direction, e.lastEvent?.dist)
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

    // 3 vue-moveable event handlers (canvas panning)

    // "Moveable" passes a custom "dragStart" event. Regarding cancelling it provides 3 functions:
    // - stopAble() -- stops the current "able", e.g. you can stop a "draggable" behavior but not a "pinchable" behavior
    // - stopDrag() -- stops all "able" behaviors. stopDrag() is more radical than stopAble()
    // - stop()     -- not in API docs, apparently an alias for stopAble()
    onPanStart (e) {
      if (e.inputEvent.touches?.length === 2) {
        // 2 fingers always initiates pan (and pinch) regardless what they touch (item or canvas)
        LOG && console.log('onPanStart() -> STARTING CANVAS PAN (2 finger gesture)')
      } else {
        const target = e.inputEvent.target
        if (target !== this.$refs.canvas) {
          const item = target.closest('.lq-canvas-item')
          if ((!this.isAuthor || this.presentationMode) && item) {
            LOG && console.log('onPanStart() -> STARTING CANVAS PAN (read-only mode)')
          } else {
            LOG && console.log('onPanStart() -> PREVENT CANVAS PAN (not clicked on canvas)')
            // Avoid item-drag to initiate canvas-pan as well.
            // Cancel entire gesture, otherwise search input field does not receive focus (default prevented).
            e.stopDrag()
          }
        } else {
          LOG && console.log('onPanStart() -> STARTING CANVAS PAN')
        }
      }
    },

    onPan (e) {
      // LOG && console.log('onPan()', e.isFirstDrag)
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
      LOG && console.log('onPanEnd()')
      // this.dragStop()          // TODO: needed?
    },

    // 3 hammerjs event handlers (canvas pinching)

    onPinchStart (e) {
      LOG && console.log('onPinchStart()')
      this.startZoom = this.zoom
    },

    onPinch (e) {
      // LOG && console.log('onPinch()')
      this.setZoom(this.startZoom * e.scale, e.center.x, e.center.y - APP_HEADER_HEIGHT)
    },

    onPinchEnd (e) {
      LOG && console.log('onPinchEnd()')
    },

    //

    wheelZoom (e) {
      LOG && console.log('wheelZoom', e.deltaY)
      if (e.deltaY == 0) {
        return
      }
      const f = 1.1 * e.deltaY / e.deltaY
      let zoom
      if (e.deltaY > 0) {
        zoom = this.zoom / f
      } else {
        zoom = this.zoom * f
      }
      this.setZoom(zoom, e.clientX, e.clientY - APP_HEADER_HEIGHT)
    },

    trackStart ({pageX: initialPageX, pageY: initialPageY}) {
      LOG && console.log('trackStart', initialPageX, initialPageY)
      const {addEventListener, removeEventListener} = this.$refs.canvas
      let dx, dy, i

      const track = ({pageX, pageY}) => {
        dx = pageX - initialPageX
        dy = pageY - initialPageY
        LOG && console.log('track', dx, dy, i)
        if (!i) {
          i = setInterval(pan, 50)
        }
      }

      const pan = () => {
        this.$store.dispatch('setViewport', {
          pan: {
            x: this.pan.x + TRACK_PAN_SPEED * dx,
            y: this.pan.y + TRACK_PAN_SPEED * dy
          }
        })
      }

      const trackStop = () => {
        LOG && console.log('trackStop')
        removeEventListener('mousemove', track)
        removeEventListener('mouseup',   trackStop)
        clearInterval(i)
        this.dragStop()
      }

      addEventListener('mousemove', track)
      addEventListener('mouseup', trackStop)
      this.dragStart('track-pan')
    },

    /**
     * @param   width     in pixel (Number)
     * @param   height    in pixel (Number), or 'auto' (String)
     */
    setSize (target, width, height) {
      // Note: for measurement "moveable" relies on immediately updated *view*.
      // The view updated by Vue.js (as based on *model*) is only up-to-date at next tick.
      const topic = this.findTopic(target)
      // update model
      topic.setViewProp('dmx.topicmaps.width', width)
      topic.setViewProp('dmx.topicmaps.height', height)
      // update view
      target.style.width = `${width}px`
      target.style.height = `${height}${height !== 'auto' ? 'px' : ''}`
    },

    findTopic (el) {
      return this.selection.find(topic => topic.id == el.dataset.id)      // Note: dataset values are strings
    },

    autoHeight (e, height) {
      return e.direction[1] === 0 && this.config('autoHeight') ? 'auto' : height    // detect "east"-handler
    },

    transitionend () {
      this.$store.dispatch('transitionEnd')
    },

    onEnter () {
      // console.log('onEnter')
      this.groupHover = true
    },

    onLeave () {
      // console.log('onLeave')
      this.groupHover = false
    }
  }
}
