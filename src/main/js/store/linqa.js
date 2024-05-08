import Vue from 'vue'
import Vuex from 'vuex'
import http from 'axios'
import dmx from 'dmx-api'
import searchStore from './search'
import adminStore from './admin'
import errorHandler from '../error-handler'
import lq from '../lq-globals'

window.addEventListener('focus', updateCookies)
window.addEventListener('resize', updateSmallScreenState)

Vue.use(Vuex)

const linqaAdminWs = dmx.rpc.getTopicByUri('linqa.admin_ws', true).then(workspace => {      // includeChildren=true
  state.linqaAdminWs = workspace
  return workspace
})
const userReady = dmx.rpc.getUsername().then(initUserState)
const langReady = initLangConfig()
const width = window.innerWidth
const isSmallScreen = width <= lq.SMALL_SCREEN_WIDTH
const panelVisibility = !isSmallScreen
const panelX = isSmallScreen ? 14 : 0.65 * width
console.log('[Linqa] isSmallScreen:', isSmallScreen,
  `(${width}px ${isSmallScreen ? '<=' : '>'} ${lq.SMALL_SCREEN_WIDTH}px)`
)

loadCustomCSS()

const state = {

  userReady,                    // a promise, resolved once User state is initialized
  langReady,                    // a promise, resolved once lang1/lang2 state is initialized
  isSmallScreen,
  users: [],                    // all users in the system (array of plain Username topics, sorted by username=email
                                // address). "memberships" prop holds respective user's Workspaces (array), initialized
                                // on-demand on a per-user basis, unsorted; a sorted per-user Workspaces array is
                                // available by the "sortedMemberships" getter (object).
  linqaAdminWs: undefined,      // the "Linqa Administration" Workspace (dmx.Topic); inited once User state is ready
  lang: '',                     // selected UI language (ISO 639-1 language code, e.g. 'de', 'fr', 'fi', 'sv')
  lang1: '',                    // configured UI language 1 (ISO 639-1 language code, e.g. 'de', 'fr', 'fi', 'sv')
  lang2: '',                    // configured UI language 2 (ISO 639-1 language code, e.g. 'de', 'fr', 'fi', 'sv')
  uiStrings: {},                // 2 keys: lang1/lang2 (ISO 639-1 language code), value: object
  loginMessage: '',             // the status message shown next to Login button

  // User
  username: '',                 // username of current user (String), empty/undefined if not logged in
  workspaces: [],               // Linqa shared workspaces of current user (array of plain Workspace topics), "assoc"
                                // prop holds user's Membership. "Linqa Administration" workspace is not included.
                                // Array is unsorted; a sorted array is available by the "sortedWorkspaces" getter.
  isLinqaAdmin: false,          // true if the current user is a Linqa admin (Boolean)
  workspace: undefined,         // the selected workspace (dmx.Topic, w/o "assoc" prop)
  isWritable: false,            // true if the selected workspace is writable by the current user (Boolean)
  isEditor: false,              // true if the current user is an editor of the selected workspace (Boolean)
  presentationMode: false,      // true if UI is in presentation mode

  // Canvas
  topicmap: undefined,          // the topicmap displayed on canvas (dmx.Topicmap)
  topic: undefined,             // the selected topic (dmx.ViewTopic), undefined if nothing is selected   // TODO: drop
  selection: [],                // the selected topics (array of dmx.ViewTopic)
  pan: {x: 0, y: 0},            // canvas pan (in pixel)                  // TODO: drop this, calculate instead?
  zoom: 1,                      // canvas zoom (Number)                   // TODO: drop this, calculate instead?
  isDragging: false,            // true while any dragging is in progress (canvas pan, panel resize, line handle drag)
  transition: false,            // true while a canvas pan/zoom transition is in progress
  isEditActive: [],             // IDs of topics being edited (array)
  fullscreen: false,            // if true the current document is rendered fullscreen
  pageNr: {
    lang1: {},                  // key: document topic ID, value: pageNr (Number)
    lang2: {}                   // key: document topic ID, value: pageNr (Number)
  },

  // Discussion Panel
  panelVisibility,              // discussion panel visibility (Boolean)
  panelX,                       // x coordinate in pixel (Number)
  discussion: undefined,        // the comments displayed in discussion panel (array of dmx.RelatedTopic)
  discussionLoading: false,     // true while a discussion is loading
  documentFilter: undefined,    // discussion is filtered by this document (a Document topic, plain object)
  textblockFilter: undefined    // discussion is filtered by this textblock (a Textblock topic, plain object)
                                // Either one of both is set, or none. TODO: unify these 2
}

const actions = {

  login ({dispatch}, credentials) {
    const authMethod = DEV || credentials.username === 'admin' ? 'Basic' : 'LDAP'
    return dmx.rpc.login(credentials, authMethod).then(username => {
      DEV && console.log('[Linqa] Login', username)
      state.loginMessage = 'Login OK'
      return initUserState(username).then(() =>
        dispatch('getInitialWorkspaceId')
      ).then(workspaceId =>
        dispatch('callWorkspaceRoute', workspaceId)
      ).catch(error =>
        Vue.prototype.$alert(error.message, {
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

  logout () {
    DEV && console.log('[Linqa] Logout', state.username)
    return dmx.rpc.logout().then(initUserState)
  },

  /**
   * Fetches the Linqa shared workspaces of the current user.
   */
  fetchLinqaWorkspaces () {
    return http.get('/linqa/workspaces').then(response => {
      state.workspaces = response.data
    })
  },

  fetchAllUsers () {
    if (!state.users.length) {
      return http.get('/linqa/users').then(response => {
        state.users = response.data.sort(lq.topicSort)
      })
    }
  },

  setLang (_, lang) {
    state.lang = lang
    dmx.utils.setCookie('linqa_lang', lang)
  },

  setWorkspace ({dispatch}, workspaceId) {
    if (!workspaceId) {
      throw Error(`${workspaceId} is not a workspace ID`)
    }
    dispatch('deselect')                        // reset selection
    dispatch('setDocumentFilter', undefined)    // reset document-filter
    dispatch('setTextblockFilter', undefined)   // reset textblock-filter
    dispatch('search/search', '')               // reset search
    dmx.rpc.getTopic(workspaceId, true).then(workspace => {           // includeChildren=true
      if (workspace.typeUri !== 'dmx.workspaces.workspace') {
        throw Error(`${workspaceId} is not a workspace (but a ${workspace.typeUri})`)
      }
      state.workspace = workspace
      updateWorkspaceState()
      return updateCookies()
    }).then(() => {
      fetchDiscussion()
      return fetchTopicmap()
    }).then(topicmap => {
      state.topicmap = topicmap
      const viewport = lq.getViewport()
      dispatch('setViewport', {pan: viewport.pan, zoom: viewport.zoom, transition: true})
    }).catch(error => {
      console.warn(`Workspace ${workspaceId} check failed`, error)
    })
  },

  /**
   * Updates the application's selection state according to an *interactive* selection.
   */
  updateSelection (_, {addTopics, removeTopicIds}) {
    state.selection = state.selection.filter(topic => !removeTopicIds.includes(topic.id))
    state.selection.push(...addTopics)
  },

  /**
   * Selects topics *programmatically*.
   * Precondition: the topics are already in DOM.
   *
   * @param   topics    array of dmx.ViewTopic
   */
  select ({dispatch}, topics) {
    state.selection = topics
    // update "Selecto" component's internal selection state
    const targets = topics.map(topic => {
      return document.querySelector(`.lq-canvas-item[data-id="${topic.id}"]`)
    })
    document.querySelector('.lq-canvas .selecto-selection').__vue__.setSelectedTargets(targets)
    setTimeout(() => {    // Vue.nextTick() does not work here
      document.querySelector('.lq-canvas').__vue__.positionGroupToolbar()
    }, 100)
  },

  /**
   * Removes the selection *programmatically*.
   * Note: *interactive* (de)selection is handled by "Selecto" component, resulting in `updateSelection()`.
   */
  deselect () {
    state.selection = []
    // update "Selecto" component's internal selection state
    // Note: while app initialization components are not yet available, `deselect()` is dispacthed by `setWorkspace()`
    document.querySelector('.lq-canvas .selecto-selection')?.__vue__.setSelectedTargets([])
  },

  // 1 newTopic() action to show a create form on the canvas. Used for all 6 canvas item types. ### FIXDOC
  // Dispatched from lq-canvas.vue

  /**
   * @param   topic   a dmx.ViewTopic with a synthetic (negative) ID.
   */
  newTopic ({dispatch}, topic) {
    state.topicmap.addTopic(topic)      // update client state
    state.isEditActive.push(topic.id)
    //
    // workaround to prevent body scrolling when new topic exceeds viewport
    // ### TODO: not needed anymore, since body overflow hidden?
    // document.body.classList.add('fixed')
    Vue.nextTick(() => {
      // a fixed body would not adapt to window resize anymore
      // document.body.classList.remove('fixed')
      dispatch('select', [topic])       // programmatic selection
    })
  },

  // TODO: unify these 2

  /**
   * @param   topic   a dmx.ViewTopic
   */
  createShape ({dispatch}, topic) {
    state.topicmap.addTopic(topic)      // update client state
    return dmx.rpc.createTopic(topic).then(_topic => {
      addTopicToTopicmap(topic, _topic, dispatch)
    })
  },

  /**
   * @param   topic   a dmx.ViewTopic
   */
  createLine ({dispatch}, topic) {
    state.topicmap.addTopic(topic)      // update client state
    return dmx.rpc.createTopic(topic).then(_topic => {
      addTopicToTopicmap(topic, _topic, dispatch)
    })
  },

  // 4 create() actions, dispatched when "OK" is pressed in an create form. ### FIXDOC

  /**
   * @param   type          'note'/'textblock'/'heading'
   * @param   topic         a dmx.ViewTopic of the respective type.
   *                        Its "value" is used for topic creation (not its "children").
   * @param   monolingual   Optional: if truish a monolingual topic is created (no auto-translation)
   */
  createTopic ({dispatch}, {type, topic, monolingual}) {
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
      removeEditActive(topic)
      addTopicToTopicmap(topic, _topic, dispatch)
    })
  },

  /**
   * @param   topic         a dmx.ViewTopic of type "Document"
   * @param   monolingual   Optional: if truish a monolingual document is created (no auto-translation)
   */
  createDocument ({dispatch}, {topic, monolingual}) {
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
      removeEditActive(topic)
      addTopicToTopicmap(topic, _topic, dispatch)
    })
  },

  // 4 update() actions, dispatched when "OK" is pressed in an update form. ### FIXDOC ### TODO: rename to "save"
  // Both, client state and server state is updated and the form is closed.

  /**
   * @param   topic   a dmx.ViewTopic
   */
  update (_, topic) {
    return dmx.rpc.updateTopic(topic).then(removeEditActive)
  },

  // TODO: unify these 3

  updateColor (_, topic) {
    dmx.rpc.setTopicViewProps(state.topicmap.id, topic.id, {
      'linqa.color': topic.viewProps['linqa.color']
    })
  },

  updateShapeType (_, topic) {
    dmx.rpc.setTopicViewProps(state.topicmap.id, topic.id, {
      'linqa.shape_type': topic.viewProps['linqa.shape_type']
    })
  },

  updateArrowheads (_, topic) {
    dmx.rpc.setTopicViewProps(state.topicmap.id, topic.id, {
      'linqa.arrowheads': topic.viewProps['linqa.arrowheads']
    })
  },

  // TODO: receive array of propURIs and construct viewProps object
  /* setTopicViewProps (_, {topicId, viewProps}) {
    dmx.rpc.setTopicViewProps(state.topicmap.id, topicId, viewProps)
  }, */

  storeTopicPos (_, topic) {
    if (topic.id >= 0) {
      dmx.rpc.setTopicPosition(state.topicmap.id, topic.id, topic.pos)      // update server state
    }
  },

  storeTopicCoords (_, topicCoords) {
    dmx.rpc.setTopicPositions(state.topicmap.id, topicCoords)               // update server state
  },

  storeTopicSize (_, topic) {
    if (topic.id >= 0) {
      dmx.rpc.setTopicViewProps(state.topicmap.id, topic.id, {
        'dmx.topicmaps.width': topic.viewProps['dmx.topicmaps.width'],
        'dmx.topicmaps.height': topic.viewProps['dmx.topicmaps.height']
      })
    }
  },

  storeTopicAngle (_, topic) {
    if (topic.id >= 0) {
      dmx.rpc.setTopicViewProps(state.topicmap.id, topic.id, {
        'linqa.angle': topic.viewProps['linqa.angle']
      })
    }
  },

  storeLineHandles (_, topic) {
    // Note: the server would store doubles but can't retrieve doubles but integers (ClassCastException)!
    // So we better do the rounding here.
    dmx.rpc.setTopicViewProps(state.topicmap.id, topic.id, {
      'dmx.topicmaps.x':     Math.round(topic.viewProps['dmx.topicmaps.x']),
      'dmx.topicmaps.y':     Math.round(topic.viewProps['dmx.topicmaps.y']),
      'dmx.topicmaps.width': topic.viewProps['dmx.topicmaps.width'],
      'linqa.angle':  topic.viewProps['linqa.angle']
    })
  },

  revealTopic ({dispatch}, topic) {
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
  setViewport (_, {pan, zoom, transition = false}) {
    // Note: pan/zoom state is not persisted. We have the Viewport topic instead.
    state.pan = pan
    if (zoom) {
      state.zoom = zoom
    }
    state.transition = transition
  },

  transitionEnd () {
    state.transition = false
  },

  setPanelVisibility (_, visibility) {
    state.panelVisibility = visibility
  },

  setPanelX (_, x) {
    state.panelX = x
  },

  readPanelXFromView () {
    const panel = document.querySelector('.left-panel')
    if (panel) {    // only available for workspace view (not e.g. for login page or admin area)
      state.panelX = panel.clientWidth
    }
  },

  dragStart () {
    state.isDragging = true
  },

  dragStop () {
    state.isDragging = false
  },

  setFullscreen ({dispatch}, fullscreen) {
    state.fullscreen = fullscreen
    if (!fullscreen) {
      Vue.nextTick(() => {
        document.querySelector('.lq-resizer').__vue__.resize()
        dispatch('select', [state.selection[0]])      // sync Selecto model/view with app state
      })
    }
  },

  initPageNr (_, topicId) {
    const pageNr = state.pageNr[lq.langSuffix(state.lang)]
    if (!pageNr[topicId]) {
      Vue.set(pageNr, topicId, 1)
    }
  },

  prevPage (_, topicId) {
    const pageNr = state.pageNr[lq.langSuffix(state.lang)]
    if (pageNr[topicId] > 1) {
      pageNr[topicId]--
      return true
    }
  },

  nextPage (_, {topicId, numPages}) {
    const pageNr = state.pageNr[lq.langSuffix(state.lang)]
    if (pageNr[topicId] < numPages) {
      pageNr[topicId]++
      return true
    }
  },

  //

  cancel ({dispatch}, topic) {
    if (topic.id < 0) {
      // abort creation
      state.topicmap.removeTopic(topic.id)  // update client state
      dispatch('deselect')
    }
    removeEditActive(topic)                 // update client state
  },

  /**
   * @param   comment         the comment (String)
   * @param   refTopicIds     array: a Comment ID, or a Document ID, or both
   * @param   monolingual     Optional: if truish a monolingual comment is created (no auto-translation)
   */
  createComment (_, {comment, refTopicIds, fileTopicIds, monolingual}) {
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
  updateComment (_, comment) {
    dmx.rpc.updateTopic(comment).then(replaceComment)
  },

  addComment (_, comment) {
    state.discussion.push(comment)
  },

  /**
   * @param   comment   if not part of the current discussion nothing happens.
   */
  replaceComment (_, comment) {
    const i = findCommentIndex(comment)
    if (i >= 0) {
      state.discussion.splice(i, 1, comment)
    }
  },

  /**
   * @param   comment   if not part of the current discussion nothing happens.
   */
  removeComment (_, comment) {
    const i = findCommentIndex(comment)
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
   * @param   doc     a Document topic (plain object)
   */
  revealDocument ({dispatch}, doc) {
    dispatch('revealTopic', state.topicmap.getTopic(doc.id))
    dispatch('setDocumentFilter', doc)
  },

  /**
   * @param   doc     a Textblock topic (plain object)
   */
  revealTextblock ({dispatch}, textblock) {
    dispatch('revealTopic', state.topicmap.getTopic(textblock.id))
    dispatch('setTextblockFilter', textblock)
  },

  /**
   * @param   doc     optional: a Document topic (plain object)
   */
  setDocumentFilter ({dispatch}, doc) {
    state.documentFilter = doc
    if (doc) {
      state.textblockFilter = undefined
      dispatch('setPanelVisibility', true)
    }
    dispatch('updatePlaceholder')
  },

  /**
   * @param   textblock     optional: a Textblock topic (plain object)
   */
  setTextblockFilter ({dispatch}, textblock) {
    state.textblockFilter = textblock
    if (textblock) {
      state.documentFilter = undefined
      dispatch('setPanelVisibility', true)
    }
    dispatch('updatePlaceholder')
  },

  updatePlaceholder () {
      const editor = document.querySelector('.lq-discussion .new-comment .ql-editor')
      // editor is not available
      // 1) while app launch, updatePlaceholder() is called by setWorkspace()     // TODO: revise
      // 2) when discussion panel is closed
      if (editor) {
        const suffix = state.documentFilter ? '_document' : state.textblockFilter ? '_textblock' : ''
        editor.dataset.placeholder = lq.getString('label.new_comment' + suffix)
      }
  },

  // 4 actions dispatched from canvas-item toolbar

  edit ({dispatch}, topic) {
    dispatch('select', [topic])             // programmatic selection
    state.isEditActive.push(topic.id)
  },

  duplicateMulti ({dispatch}, topicIds) {
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
      Vue.nextTick(() => {
        dispatch('select', viewTopics)      // programmatic selection
      })
    })
  },

  setLockedMulti (_, {locked, topics}) {
    // update client state
    const topicIds = topics.map(topic => {
      if (!topic.children['linqa.locked']) {
        Vue.set(topic.children, 'linqa.locked', {})
      }
      Vue.set(topic.children['linqa.locked'], 'value', locked)
      return topic.id
    })
    // update server state
    http.put(`/linqa/locked/${locked}/${topicIds}`)
  },

  // dispatched when a canvas-item's "delete" button is pressed
  delete ({dispatch}, topic) {
    dispatch('select', [topic])             // programmatic selection
    lq.confirmDeletion().then(() => {
      dispatch('deselect')
      state.topicmap.removeTopic(topic.id)            // update client state
      dmx.rpc.deleteTopic(topic.id)                   // update server state
    }).catch(() => {})                      // suppress unhandled rejection on cancel
  },

  //

  // dispatched from canvas when a multi-selection is deleted
  deleteMulti ({dispatch}, topicIds) {
    lq.confirmDeletion('warning.delete_multi', topicIds.length).then(() => {
      dispatch('deselect')
      topicIds.forEach(id => {                        // update client state
        state.topicmap.removeTopic(id)
      })
      dmx.rpc.deleteMulti({topicIds, assocIds: []})   // update server state
    }).catch(() => {})                      // suppress unhandled rejection on cancel
  },

  deleteComment (_, comment) {
    lq.confirmDeletion('warning.delete_comment').then(() => {
      removeComment(comment)                          // update client state
      dmx.rpc.deleteTopic(comment.id)                 // update server state
    }).catch(() => {})                      // suppress unhandled rejection on cancel
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
      document.querySelector('.lq-canvas .content-layer .moveable-control-box').__vue__.updateTarget()
    })
  },

  updateUserProfile ({rootState}, userProfile) {
    return http.put(`/linqa/user_profile`, undefined, {
      params: userProfile
    }).then(() => {
      updateUserProfile(userProfile)            // update client state
      // rootState.users.sort(lq.topicSort)     // TODO: sort by display name (email address at the moment)
    })
  },

  resetPassword (_, emailAddress) {
    return http.get(`/sign-up/password-reset/${emailAddress}`).then(response => {
      console.log('response', response.data)
      if (response.data.result !== 'SUCCESS') {
        throw Error(response.data.result)
      }
      Vue.prototype.$notify({
        type: 'success',
        title: lq.getString('label.email_sent'),
        message: `${lq.getString('label.to')} ${emailAddress}`,
        showClose: false
      })
    }).catch(error => {
      Vue.prototype.$alert('An error occurred while sending the password reset mail', {
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
      Vue.prototype.$notify({
        type: 'success',
        title: 'Success!',                          // TODO
        message: 'Password changed successfully',   // TODO
        showClose: false
      })
      return result
    }).catch(error => {
      if (error.message !== 'PASSWORD_COMPLEXITY_INSUFFICIENT') {
        Vue.prototype.$alert('An error occurred while changing the password', {
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

  togglePresentationMode () {
    state.presentationMode = !state.presentationMode
  },

  downloadFile (_, repoPath) {
    const url = filerepoUrl(repoPath) + '?download'
    document.querySelector('.lq-download-iframe').contentWindow.location.assign(url)
  },

  getFileContent (_, repoPath) {
    return http.get(filerepoUrl(repoPath)).then(response => response.data)
  },

  getConfigResource (_, {fileName, fileType, multilingual}) {
    return http.get(`/linqa/config/${fileName}/${fileType}`, {params: {multilingual}})
      .then(response => response.data)
  }
}

const getters = {

  sortedWorkspaces () {
    return state.workspaces.sort(lq.workspaceSort)
  },

  sortedMemberships () {
    return state.users.reduce((memberships, user) => {
      if (user.memberships) {
        const workspaces = user.memberships.sort(lq.workspaceSort)
        memberships[user.value] = workspaces
      }
      return memberships
    }, {})
  }
}

const store = new Vuex.Store({
  state,
  actions,
  getters
})

store.registerModule('search', searchStore)     // TODO: do static registration instead
store.registerModule('admin', adminStore)       // TODO: do static registration instead

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
function initUserState (username) {
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
    state.lang1 = response.data[0]
    state.lang2 = response.data[1]
    http.get(`/systems.dmx.linqa/ui-strings/${state.lang1}.json`).then(response => {
      Vue.set(state.uiStrings, state.lang1, response.data)
    })
    http.get(`/systems.dmx.linqa/ui-strings/${state.lang2}.json`).then(response => {
      Vue.set(state.uiStrings, state.lang2, response.data)
    })
  })
}

function loadCustomCSS () {
  const link = document.createElement('link')
  link.rel = 'stylesheet'
  link.href = '/linqa/config/custom/css'
  document.head.appendChild(link)
}

function updateSmallScreenState () {
  console.log('[Linqa] new window width:', `${window.innerWidth}px`)
  state.isSmallScreen = window.innerWidth <= lq.SMALL_SCREEN_WIDTH
}

/**
 * Updates "dmx_workspace_id" and "dmx_topicmap_id" cookies according to "workspace" state.
 *
 * @return  a promise, resolved once the cookies are updated.
 */
function updateCookies () {
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

function updateWorkspaceState () {
  state.workspace.isWritable().then(isWritable => {
    state.isWritable = isWritable
  })
  if (state.workspace.id !== state.linqaAdminWs.id) {
    state.isEditor = findWorkspace(state.workspace.id).assoc.children['linqa.editor']?.value
  }
}

function findWorkspace (id) {
  const workspace = lq.findWorkspace(id)
  if (!workspace) {
    throw Error(`Workspace ${id} not found in ${state.workspaces} (${state.workspaces.length})`)
  }
  return workspace
}

function fetchDiscussion () {
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

// TODO: basically copied from admin.js
function updateUserProfile(userProfile) {
  const children = lq.getUser(state.username).children
  if (!children['dmx.signup.display_name']) {   // TODO: refactor
    Vue.set(children, 'dmx.signup.display_name', {})
  }
  children['dmx.signup.display_name'].value = userProfile.displayName
  children['linqa.show_email_address'].value = userProfile.showEmailAddress
}

/**
 * Transfers "id", "value", and "children" from the given topic to the given viewTopic and sends a
 * add-topic-to-topicmap request. Called after persisting a *limbo topic*.
 */
function addTopicToTopicmap (viewTopic, topic, dispatch) {
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
  Vue.nextTick(() => {
    dispatch('select', [viewTopic])     // programmatic selection
  })
}

function removeEditActive (topic) {
  const i = state.isEditActive.indexOf(topic.id)
  if (i === -1) {
    throw Error('removeEditActive')
  }
  state.isEditActive.splice(i, 1)
}

function removeComment (comment) {
  const i = findCommentIndex(comment)
  if (i === -1) {
    throw Error('removeComment')
  }
  state.discussion.splice(i, 1)
}

function replaceComment (comment) {
  const i = findCommentIndex(comment)
  if (i === -1) {
    throw Error('replaceComment')
  }
  state.discussion.splice(i, 1, comment)
}

function findCommentIndex (comment) {
  return state.discussion.findIndex(cmt => cmt.id === comment.id)
}

function filerepoUrl (repoPath) {
  return '/filerepo/' + encodeURIComponent(repoPath)
}
