// Global functions and values (non-reactive)

import Vue from 'vue'
import dmx from 'dmx-api'
import store from './store/linqa'

const SMALL_SCREEN_WIDTH = 600  // Threshold for switching between small/big UI layout (in pixel)
const CANVAS_GRID = 20          // 20x20 pixel = size of grid.png
const CANVAS_BORDER = 40        // Affects a) position of new items and document revelation, b) zoom-to-fit (in pixel).
                                // Should be a multiple of CANVAS_GRID.
const CANVAS_ZOOM_MIN = .02     // Zoom change is only applied if not smaller than this value
const CANVAS_ZOOM_FACTOR = 1.2  // Factor for stepwise zoom-in/zoom-out
const FORM_WIDTH = 384          // 360 = width of upload area, +24=2*12 pixel padding   // TODO: proper geometry
const LINE_LENGTH = 200         // Should be a multiple of CANVAS_GRID
const LINE_HEIGHT = 40          // Should be a multiple of CANVAS_GRID
const SHAPE_WIDTH = 200         // Should be a multiple of CANVAS_GRID
const SHAPE_HEIGHT = 120        // Should be a multiple of CANVAS_GRID

const quillOptions = require('./quill-options').default   // Quill config for canvas
const quillOptions2 = dmx.utils.clone(quillOptions)       // Quill config for discussion panel
quillOptions2.bounds = '.lq-discussion .comments'
quillOptions2.modules.toolbar.container[3].splice(2, 1)   // strip "video" button

const isChrome = /Chrome/.test(navigator.userAgent) && /Google Inc/.test(navigator.vendor)
console.log('[Linqa] isChrome:', isChrome)

export default {

  SMALL_SCREEN_WIDTH,
  CANVAS_GRID,
  CANVAS_BORDER,
  CANVAS_ZOOM_FACTOR,
  CANVAS_ZOOM_MIN,

  FORM_WIDTH,
  LINE_LENGTH,
  LINE_HEIGHT,
  SHAPE_WIDTH,
  SHAPE_HEIGHT,

  langSuffix,

  getViewport,
  getDisplayName,
  getShowEmailAddress,
  getUser,
  getString,

  topicSort,
  workspaceSort,
  findWorkspace,
  workspaceName,

  canvasFilter,
  snapToGrid,
  confirmDeletion,
  alertError,

  quillOptions,
  quillOptions2,
  isChrome
}

/**
 * @param   lang    an ISO 639-1 language code, e.g. 'de', 'fr', 'fi', 'sv'
 */
function langSuffix (lang) {
  if (lang === store.state.lang1) {
    return 'lang1'
  } else if (lang === store.state.lang2) {
    return 'lang2'
  } else {
    throw Error(`Unsupported language: "${lang}"`)
  }
}

// TODO: make it a store getter?
/**
 * @return  the viewport of the current topicmap (object with "pan" and "zoom" props).
 */
function getViewport() {
  const viewport = getViewportTopic()
  if (viewport) {
    const zoom = viewport.viewProps['dmx.topicmaps.zoom']
    return {
      pan: {
        x: -viewport.pos.x * zoom,
        y: -viewport.pos.y * zoom
      },
      zoom
    }
  } else {
    // fallback
    const topicmap = store.state.topicmap
    console.warn(`[Linqa] Viewport topic missing in Topicmap ${topicmap.id}`)
    return {
      pan: {
        x: topicmap.panX,
        y: topicmap.panY
      },
      zoom: topicmap.zoom
    }
  }
}

function getViewportTopic() {
  return store.state.topicmap.topics.find(topic => topic.typeUri === 'linqa.viewport')
}

function getDisplayName (username) {
  return getUser(username)?.children['dmx.signup.display_name']?.value || '?'
}

function getShowEmailAddress (username) {
  return getUser(username)?.children['linqa.show_email_address'].value
}

/**
 * Returns Username topic corresponding to given username (case-insensitive).
 * If no such user exists undefined is returned. The latter happens if that user has been deleted.
 */
function getUser (username) {
  // TODO: better use localeCompare() or regex (or toUpperCase()) instead of toLowerCase()?
  // https://stackoverflow.com/questions/2140627/how-to-do-case-insensitive-string-comparison
  return store.state.users.find(user => user.value.toLowerCase() === username.toLowerCase())
}

function getString (key, value) {
  const _str = store.state.uiStrings[store.state.lang]
  if (_str) {       // UI strings might not yet be loaded
    const str = _str[key]
    return value !== undefined ? substitute(str, value) : str
  }
}

function substitute (str, value) {
  const i = str.indexOf('${}')
  return str.substring(0, i) + value + str.substring(i + 3)
}

function topicSort (t1, t2) {
  return t1.value.localeCompare(t2.value)
}

function workspaceSort (w1, w2) {
  return workspaceName(w1).localeCompare(workspaceName(w2))
}

/**
 * Finds the given workspace among the current user's workspaces.
 *
 * @return  the workspace (plain topic), or undefined if the given ID does not refer to one of the current user's
 *          workspaces.
 */
function findWorkspace (id) {
  return store.state.workspaces.find(ws => ws.id === id)
}

function workspaceName (topic) {
  const lang1 = topic.children['dmx.workspaces.workspace_name#linqa.lang1']
  const lang2 = topic.children['dmx.workspaces.workspace_name#linqa.lang2']
  if (lang1 && lang2) {
    return topic.children['dmx.workspaces.workspace_name#linqa.' + langSuffix(store.state.lang)].value
  } else {
    return lang1?.value || lang2?.value || '?'
  }
}

// Note: must correspond to server-side counterpart in LinqaPlugin.java
function canvasFilter (topic) {
  return topic.typeUri === 'linqa.document'  ||
         topic.typeUri === 'linqa.note'      ||
         topic.typeUri === 'linqa.textblock' ||
         topic.typeUri === 'linqa.heading'   ||
         topic.typeUri === 'linqa.shape'     ||
         topic.typeUri === 'linqa.line'      ||
         topic.typeUri === 'linqa.viewport' && (store.state.isLinqaAdmin || store.state.isEditor)
}

function snapToGrid(value) {
  return Math.round(value / CANVAS_GRID) * CANVAS_GRID
}

function confirmDeletion (textKey = 'warning.delete', value) {
  return Vue.prototype.$confirm(getString(textKey, value), {
    type: 'warning',
    title: getString('label.warning'),
    confirmButtonText: getString('action.delete'),
    confirmButtonClass: 'el-button--danger',
    cancelButtonText: getString('action.cancel'),
    showClose: false
  })
}

function alertError (error) {
  return Vue.prototype.$alert(error.message, {
    type: 'error',
    showClose: false
  })
}
