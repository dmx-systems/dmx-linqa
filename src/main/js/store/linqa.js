import { nextTick } from 'vue'
import { createStore } from 'vuex'
import http from 'axios'
import dmx from 'dmx-api'
import searchStore from './search'
import adminStore from './admin'
import errorHandler from '../error-handler'
import app from '../app'
import lq from '../lq-globals'

window.addEventListener('focus', () => updateCookies(store.state))
window.addEventListener('resize', () => updateSmallScreenState(store.state))

const linqaAdminWs = dmx.rpc.getTopicByUri('linqa.admin_ws', true).then(workspace => {      // includeChildren=true
  store.state.linqaAdminWs = workspace
  return workspace
})
const userReady = dmx.rpc.getUsername().then(username => initUserState(store.state, username))
const langReady = initLangConfig()
const width = window.innerWidth
const isSmallScreen = width <= lq.SMALL_SCREEN_WIDTH
const presentationMode = isSmallScreen
const panelVisibility = !isSmallScreen
const panelPos = isSmallScreen ? 14 : Number(dmx.utils.getCookie('linqa_panel_pos')) || 0.75 * width
console.log('[Linqa] isSmallScreen:', isSmallScreen,
  `(${width}px ${isSmallScreen ? '<=' : '>'} ${lq.SMALL_SCREEN_WIDTH}px)`
)

// Sometimes the store needs to call component API. viewComp will have 3 properties:
//   selecto  - canvas `vue-selecto` instance                -> setSelectedTargets(...)
//   moveable - canvas content layer `vue-moveable` instance -> updateTarget()
//   divider  - workspace split panel `lq-divider` instance  -> resize()
let viewComp = {}

loadCustomCSS('custom.css')
loadCustomCSS('help/help.css')

const store = createStore({

  state: {
    userReady,                    // a promise, resolved once User state is initialized
    langReady,                    // a promise, resolved once lang1/lang2 state is initialized
    isSmallScreen,                // true for mobile UI layout, false for desktop UI layout (Boolean)
    presentationMode,             // true if UI is in presentation mode, for mobile on by default (Boolean)
    users: [],                    // all users in the system (array of plain Username topics, sorted by username=email
                                  // address). "memberships" prop holds respective user's Workspaces (array),
                                  // initialized on-demand on a per-user basis, unsorted; a sorted per-user Workspaces
                                  // array is available by the "sortedMemberships" getter (object).
    linqaAdminWs: undefined,      // the "Linqa Administration" Workspace (dmx.Topic); inited once User state is ready
    lang: '',                     // selected UI language (ISO 639-1 language code, e.g. 'de', 'fr', 'fi', 'sv')
    lang1: '',                    // configured UI language 1 (ISO 639-1 language code, e.g. 'de', 'fr', 'fi', 'sv')
    lang2: '',                    // configured UI language 2 (ISO 639-1 language code, e.g. 'de', 'fr', 'fi', 'sv')
    uiStrings: {},                // 2 keys: lang1/lang2 (ISO 639-1 language code), value: object
    loginMessage: '',             // the status message shown next to Login button
    aboutVisibility: false,       // About dialog visibility
    profileVisibility: false,     // user profile dialog visibility
    profilePane: 'privacy',       // active pane in user profile dialog ('privacy', 'notifications', 'password', '')

    // User
    username: '',                 // username of current user (String), empty/undefined if not logged in
    workspaces: [],               // Linqa workspaces of current user (array of plain Workspace topics), "assoc" prop
                                  // holds user's Membership. "Linqa Administration" workspace is not included.
                                  // Array is unsorted; a sorted array is available by the "sortedWorkspaces" getter.
    isLinqaAdmin: false,          // true if the current user is a Linqa admin (Boolean)
    workspace: undefined,         // the selected workspace (dmx.Topic, w/o "assoc" prop)
    isWritable: false,            // true if the selected workspace is writable by the current user (Boolean)
    isEditor: false,              // true if the current user is an editor of the selected workspace (Boolean)

    // Canvas
    topicmap: undefined,          // the topicmap displayed on canvas (dmx.Topicmap)
    topic: undefined,             // the selected topic (dmx.ViewTopic), undefined if nothing is selected  // TODO: drop
    selection: [],                // the selected topics (array of dmx.ViewTopic)
    pan: {x: 0, y: 0},            // canvas pan (in pixel)                  // TODO: drop this, calculate instead?
    zoom: 1,                      // canvas zoom (Number)                   // TODO: drop this, calculate instead?
    dragMode: '',                 // non-empty while dragging in progress ("drag-item", "resize-item", "track-pan",
                                  // "drag-divider", "drag-line-handle")
    transition: false,            // true while a canvas pan/zoom transition is in progress
    isEditActive: [],             // IDs of topics being edited (array)
    fullscreen: false,            // if true the current document is rendered fullscreen
    pageNr: {
      lang1: {},                  // key: document topic ID, value: pageNr (Number)
      lang2: {}                   // key: document topic ID, value: pageNr (Number)
    },
    groupToolbarPos: {x: 0, y: 0},

    // Discussion Panel
    panelVisibility,              // discussion panel visibility (Boolean)
    panelPos,                     // x coordinate of the discussion panel, regardless if open/closed, in pixel (Number)
    panelMinWidth: 320,           // mininum width for example 1/6 of a desktop 1920 screen 
    discussion: undefined,        // the comments displayed in discussion panel (array of dmx.RelatedTopic)
    discussionFilter: undefined,  // a Document/Note/Textblock topic (plain object), or undefined if no filter is active
    discussionLoading: false      // true while a discussion is loading
  },

  actions: {

    setViewComps (_, viewComps) {
      viewComp = {...viewComp, ...viewComps}
    },

    login ({state, dispatch}, credentials) {
      const authMethod = 'Basic'    // FIXME: need to retrieve configured auth method from server, could be "LDAP"
      return dmx.rpc.login(credentials, authMethod).then(username => {
        DEV && console.log('[Linqa] Login', username)
        state.loginMessage = 'Login OK'
        return initUserState(state, username).then(() =>
          dispatch('getInitialWorkspaceId')
        ).then(workspaceId =>
          dispatch('callWorkspaceRoute', workspaceId)
        ).catch(error =>
          app.config.globalProperties.$alert(error.message, {
            type: 'error',
            showClose: false
          }).then(() =>
            dispatch('logout')
          )
        ).finally(() => {
          state.loginMessage = ''
        })
      }).catch(error => {
        state.loginMessage = 'Login failed'
        if (error.response.status !== 401) {
          errorHandler(error)     // generic error handler
        }
      })
    },

    logout ({state}) {
      DEV && console.log('[Linqa] Logout', state.username)
      return dmx.rpc.logout().then(() => initUserState(state))
    },

    /**
     * Fetches the Linqa workspaces of the current user.
     */
    fetchLinqaWorkspaces ({state}) {
      return http.get('/linqa/workspaces').then(response => {
        state.workspaces = response.data
      })
    },

    fetchAllUsers ({state}) {
      if (!state.users.length) {
        return http.get('/linqa/users').then(response => {
          state.users = response.data.sort(lq.topicSort)
        })
      }
    },

    setLang ({state}, lang) {
      state.lang = lang
      dmx.utils.setCookie('linqa_lang', lang)
    },

    setWorkspace ({state, dispatch}, workspaceId) {
      if (!workspaceId) {
        throw Error(`${workspaceId} is not a workspace ID`)
      }
      dispatch('deselect')                        // reset selection
      dispatch('setDiscussionFilter', undefined)  // reset discussion-filter
      dispatch('search/search', '')               // reset search
      dmx.rpc.getTopic(workspaceId, true).then(workspace => {           // includeChildren=true
        if (workspace.typeUri !== 'dmx.workspaces.workspace') {
          throw Error(`${workspaceId} is not a workspace (but a ${workspace.typeUri})`)
        }
        state.workspace = workspace
        updateWorkspaceState(state)
        return updateCookies(state)
      }).then(() => {
        fetchDiscussion(state)
        return fetchTopicmap()
      }).then(topicmap => {
        state.topicmap = topicmap
        const viewport = lq.getViewport()
        dispatch('setViewport', {pan: viewport.pan, zoom: viewport.zoom, transition: true})
      }).catch(error => {
        console.warn(`Workspace ${workspaceId} check failed`, error)
      })
    },

    fetchWorkspaceMemberships (_, workspace) {
      if (!workspace.memberships) {
        return dmx.rpc.getMemberships(workspace.id).then(users => {
          workspace.memberships = users.sort(lq.topicSort)
        })
      }
    },

    // 3 selection actions

    /**
     * Updates the application's selection state according to an *interactive* selection.
     */
    updateSelection ({state}, {addTopics, removeTopicIds}) {
      state.selection = state.selection.filter(topic => !removeTopicIds.includes(topic.id))
      state.selection.push(...addTopics)
      setTimeout(() => {    // Vue.nextTick() does not work here
        positionGroupToolbar(state)
      }, 100)
    },

    /**
     * Selects topics *programmatically*.
     * Precondition: the topics are already in DOM.
     *
     * @param   topics    array of dmx.ViewTopic
     */
    select ({state, dispatch}, topics) {
      state.selection = topics
      // update selecto state
      const targets = topics.map(topic => {
        return document.querySelector(`.lq-canvas-item[data-id="${topic.id}"]`)
      })
      viewComp.selecto.setSelectedTargets(targets)
      //
      setTimeout(() => {    // Vue.nextTick() does not work here
        positionGroupToolbar(state)
      }, 100)
    },

    /**
     * Removes the selection *programmatically*.
     * Note: *interactive* (de)selection is handled by selecto component, resulting in `updateSelection()`.
     */
    deselect ({state}) {
      state.selection = []
      // update selecto state
      // Note: while app initialization components are not yet available, `deselect()` is dispatched by `setWorkspace()`
      // console.log('##### deselect', 'selecto available', !!selecto)    // TODO: rethink
      viewComp.selecto?.setSelectedTargets([])
    },

    // 1 newTopic() action to show a create-form on the canvas. Used for Document/Note/Textblock/Heading.
    // (For Shape/Line there is no form, these are created by "createShape"/"createLine" actions respectively.)
    // Dispatched from lq-canvas-toolbar.vue

    /**
     * @param   topic   a dmx.ViewTopic with a synthetic (negative) ID.
     */
    newTopic ({state, dispatch}, topic) {
      state.topicmap.addTopic(topic)      // update client state
      state.isEditActive.push(topic.id)
      //
      nextTick(() => {
        dispatch('select', [topic])       // programmatic selection
      })
    },

    // 4 create-actions

    /**
     * Dispatched when "OK" is pressed in a Note/Textblock/Heading create-form.
     * Creates the item and closes the form.
     *
     * @param   type          'note'/'textblock'/'heading'
     * @param   topic         a dmx.ViewTopic of the respective type.
     *                        Its "value" is used for topic creation (not its "children").
     * @param   monolingual   Optional: if truish a monolingual topic is created (no auto-translation)
     */
    createTopic ({state, dispatch}, {type, topic, monolingual}) {
      let p
      if (monolingual)  {
        // Note: a monolingual note/textblock/heading is stored in "lang1". "lang2" and "Original Language" are not set.
        p = dmx.rpc.createTopic({
          typeUri: `linqa.${type}`,
          children: {
            [`linqa.${type}_text#linqa.lang1`]: topic.value
          }
        })
      } else {
        // suppress standard HTTP error handler
        p = dmx.rpc._http.post(`/linqa/${type}`, topic.value).then(response => response.data)
      }
      return p.then(_topic => {
        removeEditActive(state, topic)
        addTopicToTopicmap(state, topic, _topic)
      })
    },

    /**
     * Dispatched when "OK" is pressed in a Document create-form.
     * Creates the Document and closes the form.
     *
     * @param   topic         a dmx.ViewTopic of type "Document"
     * @param   monolingual   Optional: if truish a monolingual document is created (no auto-translation)
     */
    createDocument ({state, dispatch}, {topic, monolingual}) {
      let p
      if (monolingual)  {
        // Note: a monolingual document name is stored in "lang1". "lang2" and "Original Language" are not set.
        p = dmx.rpc.createTopic(topic)
      } else {
        const docName = topic.children['linqa.document_name#linqa.lang1'].value
        const fileId = topic.children['dmx.files.file#linqa.lang1'].id
        // suppress standard HTTP error handler
        p = dmx.rpc._http.post('/linqa/document', docName, {params: {fileId}}).then(response => response.data)
      }
      return p.then(_topic => {
        removeEditActive(state, topic)
        addTopicToTopicmap(state, topic, _topic)
      })
    },

    // TODO: unify these 2

    /**
     * @param   topic   a dmx.ViewTopic
     */
    createShape ({state, dispatch}, topic) {
      state.topicmap.addTopic(topic)      // update client state
      return dmx.rpc.createTopic(topic).then(_topic => {
        addTopicToTopicmap(state, topic, _topic)
      })
    },

    /**
     * @param   topic   a dmx.ViewTopic
     */
    createLine ({state, dispatch}, topic) {
      state.topicmap.addTopic(topic)      // update client state
      return dmx.rpc.createTopic(topic).then(_topic => {
        addTopicToTopicmap(state, topic, _topic)
      })
    },

    // update content/positions

    /**
     * Dispatched when "OK" is pressed in a Document/Note/Textblock/Heading update-form.
     * Saves the changes and closes the form.
     *
     * @param   topic   a dmx.ViewTopic
     */
    update ({state}, topic) {
      // Reactions must not be included in core create/update request. The recent ValueIntegrator policy -- reuse topics
      // only from same workspace, otherwise create -- would create new Username topics as they live in System workspace
      delete topic.children['dmx.accesscontrol.username#linqa.reaction']
      //
      return dmx.rpc.updateTopic(topic).then(topic => removeEditActive(state, topic))
    },

    storeTopicPos ({state}, topic) {
      // Note: new unsaved ("limbo") topics have negative IDs, these are skipped
      if (topic.id >= 0) {
        dmx.rpc.setTopicPosition(state.topicmap.id, topic.id, topic.pos)      // update server state
      }
    },

    storeTopicCoords ({state}, topicCoords) {
      // Note: new unsaved ("limbo") topics have negative IDs, these are skipped
      dmx.rpc.setTopicPositions(state.topicmap.id, topicCoords.filter(entry => entry.topicId >= 0))
    },

    // 7 update view prop actions

    updateColor (_, {topic, color}) {
      // update client state
      topic.setViewProp('linqa.color', color)
      // update server state
      storeViewPops(topic.id, {'linqa.color': color})
    },

    updateShapeType (_, {topic, shape}) {
      // update client state
      topic.setViewProp('linqa.shape_type', shape)
      // update server state
      storeViewPops(topic.id, {'linqa.shape_type': shape})
    },

    updateArrowheads (_, {topic, arrowheads}) {
      // update client state
      topic.setViewProp('linqa.arrowheads', arrowheads)
      // update server state
      storeViewPops(topic.id, {'linqa.arrowheads': arrowheads})
    },

    updateLineStyle (_, {topic, lineStyle}) {
      // update client state
      topic.setViewProp('linqa.line_style', lineStyle)
      // update server state
      storeViewPops(topic.id, {'linqa.line_style': lineStyle})
    },

    /**
     * @param   width     in pixel (Number)
     * @param   height    in pixel (Number), or 'auto' (String)
     */
    updateTopicSize (_, {topic, width, height}) {
      // update client state
      topic.setViewProp('dmx.topicmaps.width', width)
      topic.setViewProp('dmx.topicmaps.height', height)
      // update server state
      if (topic.id >= 0) {
        storeViewPops(topic.id, {
          'dmx.topicmaps.width': width,
          'dmx.topicmaps.height': height
        })
      }
    },

    updateTopicAngle (_, {topic, angle}) {
      // update client state
      topic.setViewProp('linqa.angle', angle)
      // update server state
      if (topic.id >= 0) {
        storeViewPops(topic.id, {'linqa.angle': angle})
      }
    },

    storeLineGeometry (_, topic) {
      // Note: the server would store doubles but can't retrieve doubles but integers (ClassCastException)!
      // So we better do the rounding here.
      storeViewPops(topic.id, {
        'dmx.topicmaps.x':     Math.round(topic.viewProps['dmx.topicmaps.x']),
        'dmx.topicmaps.y':     Math.round(topic.viewProps['dmx.topicmaps.y']),
        'dmx.topicmaps.width': topic.viewProps['dmx.topicmaps.width'],
        'linqa.angle':  topic.viewProps['linqa.angle']
      })
    },

    //

    /**
     * @param   topic   a dmx.ViewTopic
     */
    revealTopic ({state, dispatch}, topic) {
      dispatch('select', [topic])     // programmatic selection
      dispatch('setViewport', {
        pan: {
          x: -topic.pos.x * state.zoom + lq.CANVAS_BORDER,
          y: -topic.pos.y * state.zoom + lq.CANVAS_BORDER
        },
        transition: true
      })
    },

    /**
     * @param   zoom    optional
     */
    setViewport ({state}, {pan, zoom, transition = false}) {
      // Note: pan/zoom state is not persisted. We have the Viewport topic instead.
      state.pan = pan
      if (zoom) {
        state.zoom = zoom
      }
      state.transition = transition
    },

    transitionEnd ({state}) {
      state.transition = false
    },

    setPanelVisibility ({state}, visibility) {
      state.panelVisibility = visibility
    },

    setPanelPos ({state}, x) {
      const currentScreen = document.querySelector('.lq-workspace')
      const calcMinPosition = currentScreen.clientWidth - x
      if (calcMinPosition < state.panelMinWidth) {
        state.panelPos = currentScreen.clientWidth - state.panelMinWidth
      } else {
        state.panelPos = x
      }
      dmx.utils.setCookie('linqa_panel_pos', Math.round(x))
    },

    readPanelPosFromView ({dispatch}) {
      const panel = document.querySelector('.left-panel')
      if (panel) {      // panel not available e.g. on login page or in admin area
        dispatch('setPanelPos', panel.clientWidth)
      }
    },

    dragStart ({state}, dragMode) {
      state.dragMode = dragMode
    },

    dragStop ({state}) {
      state.dragMode = ''
    },

    setFullscreen ({state, dispatch}, fullscreen) {
      state.fullscreen = fullscreen
      if (!fullscreen) {
        nextTick(() => {
          viewComp.divider?.resize()                    // Note: divider does not exist for mobile layout
          dispatch('select', [state.selection[0]])      // sync Selecto model/view with app state
        })
      }
    },

    initPageNr ({state}, topicId) {
      const pageNr = state.pageNr[lq.langSuffix(state.lang)]
      if (!pageNr[topicId]) {
        pageNr[topicId] = 1
      }
    },

    prevPage ({state}, topicId) {
      const pageNr = state.pageNr[lq.langSuffix(state.lang)]
      if (pageNr[topicId] > 1) {
        pageNr[topicId]--
        return true
      }
    },

    nextPage ({state}, {topicId, numPages}) {
      const pageNr = state.pageNr[lq.langSuffix(state.lang)]
      if (pageNr[topicId] < numPages) {
        pageNr[topicId]++
        return true
      }
    },

    //

    cancel ({state, dispatch}, topic) {
      if (topic.id < 0) {
        // abort creation
        state.topicmap.removeTopic(topic.id)  // update client state
        dispatch('deselect')
      }
      removeEditActive(state, topic)          // update client state
    },

    /**
     * @param   comment         the comment (String)
     * @param   refTopicIds     array: a Comment ID, or a Document ID, or both
     * @param   monolingual     Optional: if truish a monolingual comment is created (no auto-translation)
     */
    createComment ({state}, {comment, refTopicIds, fileTopicIds, monolingual}) {
      const _http = monolingual ? http : dmx.rpc._http
      const suffix = monolingual ? '/monolingual' : ''
      return _http.post(`/linqa/comment${suffix}`, comment, {
        params: {
          refTopicIds: refTopicIds.join(','),
          fileTopicIds: fileTopicIds.join(',')
        }
      }).then(response => {
        const comment = new dmx.Topic(response.data)
        state.discussion.push(comment)
        return comment
      })
    },

    /**
     * @param   comment   a dmx.Topic
     */
    updateComment ({state}, comment) {
      // Refs must not be included in core create/update request, otherwise the ref'd topics would be created again.
      // Is it related to recent ValueIntegrator policy -- reuse topics only from same workspace?
      delete comment.children['linqa.comment']
      delete comment.children['linqa.document']
      delete comment.children['linqa.note']
      delete comment.children['linqa.textblock']
      delete comment.children['dmx.files.file#linqa.attachment']
      //
      dmx.rpc.updateTopic(comment).then(comment => replaceComment(state, comment))
    },

    addComment ({state}, comment) {
      state.discussion.push(comment)
    },

    /**
     * @param   comment   if not part of the current discussion nothing happens.
     */
    replaceComment ({state}, comment) {
      const i = findCommentIndex(state, comment)
      if (i >= 0) {
        state.discussion.splice(i, 1, comment)
      }
    },

    /**
     * @param   comment   if not part of the current discussion nothing happens.
     */
    removeComment ({state}, comment) {
      const i = findCommentIndex(state, comment)
      if (i >= 0) {
        state.discussion.splice(i, 1)
      }
    },

    jumpToComment (_, {comment, behavior = 'smooth', glow = true}) {
      // 1) Scroll comment into view
      // Safari note: Safari ignores scrollIntoView() "behavior" option; scrolling is not smooth.
      // Chrome note: in Chrome after new-comment scrolling does not work at all if "behavior" is set to "smooth".
      // (In contrast for comment-ref-click scrolling DOES work, and is even smooth.) As workaraound we use "auto"
      // in this very case. Scrolling works then (but not smooth, as expected).
      // "scrollIntoView() has a long bug-history in Chrome, some of them are still open for now." (May 2020)
      // https://stackoverflow.com/questions/61885401/scrollintoview-is-not-working-in-chrome-version-81
      const commentSelector = `.lq-discussion .lq-comment[data-id="${comment.id}"]`
      document.querySelector(commentSelector).scrollIntoView({
        behavior,
        block: 'nearest'      // avoid body scroll
      })
      // 2) Apply "glow" effect
      if (glow) {
        const text = document.querySelector(`${commentSelector} .columns`)
        text.classList.add('glow')
        setTimeout(() => {
          text.classList.remove('glow')
        }, 3000)    // corresponds to CSS variable "--glow-duration" in App.vue
      }
    },

    /**
     * @param   topic     a Document/Note/Textblock topic (plain object)
     */
    revealTopicAndSetFilter ({state, dispatch}, topic) {
      dispatch('revealTopic', state.topicmap.getTopic(topic.id))
      dispatch('setDiscussionFilter', topic)
    },

    /**
     * @param   topic   optional: a Document/Note/Textblock topic (plain object), undefined to deactivate filter
     */
    setDiscussionFilter ({state, dispatch}, topic) {
      state.discussionFilter = topic
      if (topic) {
        dispatch('setPanelVisibility', true)
      }
      dispatch('updatePlaceholder')
    },

    updatePlaceholder ({state}) {
      const editor = document.querySelector('.lq-discussion .new-comment .ql-editor')
      // editor is not available
      // 1) while app launch, updatePlaceholder() is called by setWorkspace()     // TODO: refactor
      // 2) when discussion panel is closed
      if (editor) {
        // compute key from type URI, good idea?
        const suffix = state.discussionFilter ? '_' + state.discussionFilter.typeUri.split('.')[1] : ''
        editor.dataset.placeholder = lq.getString('label.new_comment' + suffix)
      }
    },

    // 4 actions dispatched from canvas-item toolbar

    edit ({state, dispatch}, topic) {
      dispatch('select', [topic])             // programmatic selection
      state.isEditActive.push(topic.id)
    },

    duplicateMulti ({state, dispatch}, topicIds) {
      // update server state
      http.post(`/linqa/duplicate/${topicIds}`, undefined, {
        params: {xyOffset: 2 * lq.CANVAS_GRID}
      }).then(response => {
        // update client state
        const viewTopics = response.data.map(viewTopic => {
          const _viewTopic = new dmx.ViewTopic(viewTopic)
          state.topicmap.addTopic(_viewTopic)
          return _viewTopic
        })
        nextTick(() => {
          dispatch('select', viewTopics)      // programmatic selection
        })
      })
    },

    setLockedMulti (_, {locked, topics}) {
      // update client state
      const topicIds = topics.map(topic => {
        if (!topic.children['linqa.locked']) {
          topic.children['linqa.locked'] = {}
        }
        topic.children['linqa.locked'].value = locked
        return topic.id
      })
      // update server state
      http.put(`/linqa/locked/${locked}/${topicIds}`)
    },

    // dispatched when a canvas-item's "delete" button is pressed
    delete ({state, dispatch}, topic) {
      dispatch('select', [topic])             // programmatic selection
      lq.confirmDeletion().then(() => {
        dispatch('deselect')
        state.topicmap.removeTopic(topic.id)            // update client state
        dmx.rpc.deleteTopic(topic.id)                   // update server state
      }).catch(() => {})                      // suppress unhandled rejection on cancel
    },

    //

    // dispatched from canvas when a multi-selection is deleted
    deleteMulti ({state, dispatch}, topicIds) {
      lq.confirmDeletion('warning.delete_multi', topicIds.length).then(() => {
        dispatch('deselect')
        topicIds.forEach(id => {                        // update client state
          state.topicmap.removeTopic(id)
        })
        dmx.rpc.deleteMulti({topicIds, assocIds: []})   // update server state
      }).catch(() => {})                      // suppress unhandled rejection on cancel
    },

    deleteComment ({state}, comment) {
      lq.confirmDeletion('warning.delete_comment').then(() => {
        removeComment(state, comment)                   // update client state
        dmx.rpc.deleteTopic(comment.id)                 // update server state
      }).catch(() => {})                      // suppress unhandled rejection on cancel
    },

    reactWithEmoji ({state}, {topic, emoji}) {
      const uri = 'dmx.accesscontrol.username#linqa.reaction'
      const assoc = getReactionByUser(state, topic)
      const userRef = 'ref_id:' + lq.getUser(state.username).id
      const model = assoc ?
        assoc.value === emoji ? {
          // delete reaction
          value: 'del_id:' + assoc.id,
          assoc: {id: assoc.id}   // redundant, needed by Core though :-(
        } : {
          // update reaction
          value: userRef,
          assoc: {
            id: assoc.id,         // causes overriding value instead creating new assoc
            value: emoji
          }
        } : {
          // create reaction
          value: userRef,
          assoc: {value: emoji}
        }
      dmx.rpc.updateTopic({
        id: topic.id,
        children: {[uri]: [model]}
      }).then(_topic => {
        topic.children[uri] = _topic.children[uri]
      })
    },

    /**
     * Precondition: the given topic is visible on canvas.
     */
    updateControlBox () {
      // Note: in some cases the view is already up-to-date (e.g. when dispatched from updated() live-cycle hook), in
      // others it is not (e.g. when dispatched from message-handler (setTopicPosition)). So we *always* wait for the
      // next event cycle (setTimeout).
      // Note: Vue.nextTick() instead shows strange result
      setTimeout(() => {
        viewComp.moveable.updateTarget()
      })
    },

    positionGroupToolbar ({state}) {
      positionGroupToolbar(state)
    },

    openAboutDialog ({state}) {
      state.aboutVisibility = true
    },

    closeAboutDialog ({state}) {
      state.aboutVisibility = false
    },

    openUserProfile ({state}, profilePane) {
      state.profileVisibility = true
      state.profilePane = profilePane
    },

    closeUserProfile ({state}) {
      state.profileVisibility = false
    },

    updateUserProfile ({state, rootState}, userProfile) {
      return http.put(`/linqa/user_profile`, undefined, {
        params: userProfile
      }).then(() => {
        updateUserProfile(state, userProfile)     // update client state
        // rootState.users.sort(lq.topicSort)     // TODO: sort by display name (email address at the moment)
      })
    },

    resetPassword (_, emailAddress) {
      return http.get(`/sign-up/password-reset/${emailAddress}`).then(response => {
        console.log('response', response.data)
        if (response.data.result !== 'SUCCESS') {
          throw Error(response.data.result)
        }
        app.config.globalProperties.$notify({
          type: 'success',
          title: lq.getString('label.email_sent'),
          message: `${lq.getString('label.to')} ${emailAddress}`,
          showClose: false
        })
      }).catch(error => {
        app.config.globalProperties.$alert('An error occurred while sending the password reset mail', {
          type: 'error',
          showClose: false
        })
      })
    },

    /**
     * @param   password    plain text
     */
    changePassword (_, {key, password}) {
      return http.get(`/sign-up/password-reset/${key}/${encodeURIComponent(password)}`).then(response => {
        console.log('response', response.data)
        const result = response.data.result
        if (result !== 'SUCCESS') {
          throw Error(result)
        }
        app.config.globalProperties.$notify({
          type: 'success',
          title: 'Success!',                          // TODO
          message: 'Password changed successfully',   // TODO
          showClose: false
        })
        return result
      }).catch(error => {
        if (error.message !== 'PASSWORD_COMPLEXITY_INSUFFICIENT') {
          app.config.globalProperties.$alert('An error occurred while changing the password', {
            type: 'error',
            showClose: false
          })
        }
        return error.message
      })
    },

    checkToken (_, key) {
      return http.get(`/sign-up/token/${key}`).then(response => response.data)
    },

    translate (_, text) {
      // suppress standard HTTP error handler
      return dmx.rpc._http.post('/linqa/translate', text).then(response => response.data)
    },

    togglePresentationMode ({state}) {
      state.presentationMode = !state.presentationMode
    },

    downloadFile (_, repoPath) {
      const url = filerepoUrl(repoPath) + '?download'
      document.querySelector('.download-iframe').contentWindow.location.assign(url)
    },

    getFileContent (_, repoPath) {
      return http.get(filerepoUrl(repoPath)).then(response => response.data)
    },

    getConfigResource (_, {path, multilingual, lang}) {
      return http.get(`/linqa/config/${path}`, {params: {multilingual, lang}})
        .then(response => response.data)
    },

    getHelpPages () {
      return http.get('/linqa/help').then(response => response.data)
    }
  },

  getters: {

    sortedWorkspaces (state) {
      return state.workspaces.sort(lq.workspaceSort)
    },

    sortedMemberships (state) {
      return state.users.reduce((memberships, user) => {
        if (user.memberships) {
          const workspaces = user.memberships.sort(lq.workspaceSort)
          memberships[user.value] = workspaces
        }
        return memberships
      }, {})
    }
  },

  modules: {
    search: searchStore,
    admin: adminStore
  }
})

export default store

/**
 * Initialzes 4 states:
 *   "username"
 *   "isLinqaAdmin"
 *   "workspaces"
 *   "users"
 *
 * @param   username  the username or empty/undefined if not logged in
 *
 * @return  a promise, resolved once the state is initialized (logged in case),
 *          or undefined (logged out case).
 */
function initUserState (state, username) {
  if (username) {     // Login
    return Promise.all([
      linqaAdminWs
        .then(workspace => workspace.isWritable())
        .then(isWritable => {
          state.username = username
          state.isLinqaAdmin = isWritable
        }),
      store.dispatch('fetchLinqaWorkspaces'),
      store.dispatch('fetchAllUsers')     // needed for accessing display names
    ])
  } else {            // Logout
    state.username = ''
    state.isLinqaAdmin = false
    state.workspaces = []
    state.workspace = undefined
    store.dispatch('deselect')
  }
}

function initLangConfig () {
  return http.get('/linqa/config/lang').then(response => {
    const state = store.state
    state.lang1 = response.data[0]
    state.lang2 = response.data[1]
    http.get(`/systems.dmx.linqa/ui-strings/${state.lang1}.json`).then(response => {
      state.uiStrings[state.lang1] = response.data
    })
    http.get(`/systems.dmx.linqa/ui-strings/${state.lang2}.json`).then(response => {
      state.uiStrings[state.lang2] = response.data
    })
  })
}

function loadCustomCSS (css) {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = '/linqa/config/' + css
  document.head.appendChild(link)
}

function updateSmallScreenState (state) {
  // console.log('[Linqa] new window width:', `${window.innerWidth}px`)
  state.isSmallScreen = window.innerWidth <= lq.SMALL_SCREEN_WIDTH
}

/**
 * Updates "dmx_workspace_id" and "dmx_topicmap_id" cookies according to "workspace" state.
 *
 * @return  a promise, resolved once the cookies are updated.
 */
function updateCookies (state) {
  if (state.workspace) {
    // 1) workspace cookie
    dmx.utils.setCookie('dmx_workspace_id', state.workspace.id)
    // 2) topicmap cookie
    return dmx.rpc.getAssignedTopics(state.workspace.id, 'dmx.topicmaps.topicmap').then(topics => {
      // TODO: show warning if there are more than one topicmaps
      const topicmapId = topics[0].id
      dmx.utils.setCookie('dmx_topicmap_id', topicmapId)
    })
  }
}

function updateWorkspaceState (state) {
  state.workspace.isWritable().then(isWritable => {
    state.isWritable = isWritable
  })
  if (state.workspace.id !== state.linqaAdminWs.id) {
    state.isEditor = findWorkspace(state, state.workspace.id).assoc.children['linqa.editor']?.value
  }
  store.dispatch('fetchWorkspaceMemberships', state.workspace)
}

function findWorkspace (state, id) {
  const workspace = lq.findWorkspace(id)
  if (!workspace) {
    throw Error(`Workspace ${id} not found in ${state.workspaces} (${state.workspaces.length})`)
  }
  return workspace
}

function fetchDiscussion (state) {
  state.topicmap = undefined        // on workspace switch discussion refs must not refer to outdated topicmap items
  state.discussion = undefined      // trigger recalculation of "noComments" (lq-discussion.vue), load-spinner appears
  state.discussionLoading = true
  http.get('/linqa/discussion').then(response => {
    state.discussion = dmx.utils.instantiateMany(response.data, dmx.Topic).sort(
      (c1, c2) => c1.children['dmx.timestamps.created'].value - c2.children['dmx.timestamps.created'].value
    )
    state.discussionLoading = false
  })
}

function fetchTopicmap () {
  const topicmapId = dmx.utils.getCookie('dmx_topicmap_id')
  return dmx.rpc.getTopicmap(topicmapId, true)      // includeChildren=true
}

function storeViewPops (topicId, viewProps) {
  http.put(`/linqa/topic/${topicId}`, viewProps)
}

// TODO: display name logic copied from admin.js updateUser()
function updateUserProfile(state, userProfile) {
  const children = lq.getUser(state.username).children
  // Note: for show_email_address and notification_level server sends a default value, for display_name it does not
  if (!children['dmx.signup.display_name']) {
    children['dmx.signup.display_name'] = {}
  }
  children['dmx.signup.display_name'].value = userProfile.displayName
  children['linqa.show_email_address'].value = userProfile.showEmailAddress
  children['linqa.notification_level'].value = userProfile.notificationLevel
}

/**
 * Transfers "id", "value", and "children" from the given topic to the given viewTopic and sends a
 * add-topic-to-topicmap request. Called after persisting a *limbo topic*.
 */
function addTopicToTopicmap (state, viewTopic, topic) {
  // update client state
  // Note: we must remove the topic from topicmap before its ID is overridden and re-add it.
  // Otherwise the canvas DOM would not re-render in case the new topic is deleted afterwards.
  // The canvas template uses topic.id as the key in a v-for loop.
  state.topicmap.removeTopic(viewTopic.id)
  viewTopic.id       = topic.id
  viewTopic.value    = topic.value
  viewTopic.children = {...viewTopic.children, ...topic.children}   // merge to keep synthetic child values (color)
  state.topicmap.addTopic(viewTopic)
  // update server state
  dmx.rpc.addTopicToTopicmap(state.topicmap.id, topic.id, viewTopic.viewProps)
  nextTick(() => {
    store.dispatch('select', [viewTopic])     // programmatic selection
  })
}

function positionGroupToolbar (state) {
  const selector = '.lq-canvas .content-layer .moveable-control-box'
  const moveableArea = document.querySelector(`${selector} .moveable-area`)
  if (moveableArea) {
    const controlBox = document.querySelector(selector)
    const match = controlBox.style.transform.match(/translate3d\((-?[0-9.]+)px, (-?[0-9.]+)px, 0px\)/)
    state.groupToolbarPos = {
      x: Number(match[1]),
      y: Number(match[2]) + moveableArea.clientHeight
    }
    // console.log('positionGroupToolbar', state.groupToolbarPos)
  }
}

function removeEditActive (state, topic) {
  const i = state.isEditActive.indexOf(topic.id)
  if (i === -1) {
    throw Error('removeEditActive')
  }
  state.isEditActive.splice(i, 1)
}

function removeComment (state, comment) {
  const i = findCommentIndex(state, comment)
  if (i === -1) {
    throw Error('removeComment')
  }
  state.discussion.splice(i, 1)
}

function replaceComment (state, comment) {
  const i = findCommentIndex(state, comment)
  if (i === -1) {
    throw Error('replaceComment')
  }
  state.discussion.splice(i, 1, comment)
}

function findCommentIndex (state, comment) {
  return state.discussion.findIndex(cmt => cmt.id === comment.id)
}

function filerepoUrl (repoPath) {
  return '/filerepo/' + encodeURIComponent(repoPath)
}

function getReactionByUser (state, topic) {
  const r = topic.children['dmx.accesscontrol.username#linqa.reaction']?.find(reaction => {
    return reaction.value === state.username
  })
  return r?.assoc
}
