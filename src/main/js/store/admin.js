import { nextTick } from 'vue'
import http from 'axios'
import dmx from 'dmx-api'
import lq from '../lq-globals'

const state = {

  // Admin area (global)
  primaryPanel: 'lq-workspace-list',  // 'lq-workspace-list'/'lq-user-list'
  secondaryPanel: undefined,          // 'lq-workspace-form'/... or undefined if secondary panel is not engaged
  loading1: false,                    // true while operation in progress, disables primary panel
  loading2: false,                    // true while operation in progress, disables secondary panel

  // "Workspaces" tab
  workspaces: [],                     // all Linqa shared workspaces + "Linqa Administration" (dmx.Topic, clone() used)
  expandedWorkspaceIds: [],           // IDs of the workspaces that are expanded
  selectedWorkspace: undefined,       // (plain Workspace topic)

  // "Users" tab
  // Note: "users" is found in root state (see linqa.js) as it also holds the user display names
  expandedUsernames: [],              // usernames of the users that are expanded (array of String)
  selectedUser: undefined             // (plain Username topic)
}

const actions = {

  gotoPrimaryPanel (_, panel) {
    state.primaryPanel = panel
    state.secondaryPanel = undefined
  },

  newWorkspace () {
    state.secondaryPanel = 'lq-workspace-form'
    state.selectedWorkspace = undefined
  },

  editWorkspace (_, workspace) {
    state.secondaryPanel = 'lq-workspace-form'
    state.selectedWorkspace = workspace
  },

  newUser () {
    state.secondaryPanel = 'lq-user-form'
    state.selectedUser = undefined
  },

  editUser (_, user) {
    state.secondaryPanel = 'lq-user-form'
    state.selectedUser = user
  },

  editWorkspaceMemberships (_, workspace) {
    state.secondaryPanel = 'lq-workspace-memberships'
    state.selectedWorkspace = workspace
  },

  editUserMemberships (_, user) {
    state.secondaryPanel = 'lq-user-memberships'
    state.selectedUser = user
  },

  cancelForm () {
    state.secondaryPanel = undefined
  },

  setExpandedWorkspaceIds ({dispatch}, workspaceIds) {
    state.expandedWorkspaceIds = workspaceIds
    workspaceIds.forEach(id => {
      dispatch('fetchWorkspaceMemberships', findWorkspace(id), {root: true})
    })
  },

  setExpandedUsernames ({dispatch}, usernames) {
    state.expandedUsernames = usernames
    usernames.forEach(username => {
      dispatch('fetchUserMemberships', username)
    })
  },

  expandWorkspace (_, workspaceId) {
    if (!state.expandedWorkspaceIds.includes(workspaceId)) {
      state.expandedWorkspaceIds.push(workspaceId)
    }
  },

  expandUser (_, username) {
    if (!state.expandedUsernames.includes(username)) {
      state.expandedUsernames.push(username)
    }
  },

  fetchAllLinqaWorkspaces ({rootState}) {
    if (!state.workspaces.length) {
      return http.get('/linqa/admin/workspaces').then(response => {
        state.workspaces = dmx.utils.instantiateMany(response.data, dmx.Topic)
        state.workspaces.push(rootState.linqaAdminWs)
      })
    }
  },

  /**
   * Refreshes a given user's memberships state, if needed.
   *
   * Fetches the given user's memberships and stores them in the Username topic's (as of `users` root state)
   * `memberships` ad-hoc property (array of workspace topics).
   * If memberships are fetched already (`memberships` property is defined) nothing is performed.
   */
  fetchUserMemberships (_, username) {
    const usernameTopic = lq.getUser(username)
    if (!usernameTopic.memberships) {
      return http.get(`/linqa/admin/user/${username}/workspaces`).then(response => {
        const workspaces = response.data
        usernameTopic.memberships = workspaces
      })
    }
  },

  updateWorkspaceMemberships ({rootState, dispatch}, {addUserIds1, removeUserIds1, addUserIds2, removeUserIds2}) {
    state.loading2 = true
    const workspace = state.selectedWorkspace
    dispatch('expandWorkspace', workspace.id)
    return http.put(`/linqa/admin/workspace/${workspace.id}`, undefined, {
      params: {
        addUserIds1: addUserIds1.join(','),
        removeUserIds1: removeUserIds1.join(','),
        addUserIds2: addUserIds2.join(','),
        removeUserIds2: removeUserIds2.join(',')
      }
    }).then(response => {
      const users = response.data
      workspace.memberships = users.sort(lq.topicSort)
      collapseUsers(rootState, dispatch)
      state.secondaryPanel = undefined
      state.loading2 = false
    })
  },

  updateUserMemberships ({dispatch}, {addWorkspaceIds1, removeWorkspaceIds1, addWorkspaceIds2, removeWorkspaceIds2}) {
    state.loading2 = true
    const user = state.selectedUser
    dispatch('expandUser', user.value)
    return http.put(`/linqa/admin/user/${user.value}`, undefined, {
      params: {
        addWorkspaceIds1: addWorkspaceIds1.join(','),
        removeWorkspaceIds1: removeWorkspaceIds1.join(','),
        addWorkspaceIds2: addWorkspaceIds2.join(','),
        removeWorkspaceIds2: removeWorkspaceIds2.join(',')
      }
    }).then(response => {
      user.memberships = response.data
      collapseWorkspaces(dispatch)
      state.secondaryPanel = undefined
      state.loading2 = false
    })
  },

  createLinqaWorkspace ({rootState, dispatch}, {nameLang1, nameLang2}) {
    state.loading2 = true
    return http.post('/linqa/admin/workspace', undefined, {                       // update server state
      params: {nameLang1, nameLang2}
    }).then(response => {
      addWorkspace(response.data, rootState, dispatch)                            // update client state
      state.selectedWorkspace = response.data
      state.secondaryPanel = undefined
      state.loading2 = false
    })
  },

  duplicateWorkspace ({rootState, dispatch}, workspace) {
    state.loading1 = true
    state.selectedWorkspace = workspace
    return http.post(`/linqa/admin/workspace/${workspace.id}`).then(response => { // update server state
      addWorkspace(response.data, rootState, dispatch)                            // update client state
      state.selectedWorkspace = response.data
      state.loading1 = false
    })
  },

  updateWorkspace ({rootState, dispatch}, workspace) {
    state.loading2 = true
    return dmx.rpc.updateTopic(workspace).then(workspace => {
      replaceWorkspace(workspace, rootState, dispatch)
      collapseUsers(rootState, dispatch)
      state.secondaryPanel = undefined
      state.loading2 = false
    })
  },

  deleteWorkspace (_, workspace) {
    state.selectedWorkspace = workspace
    return lq.confirmDeletion('warning.delete_workspace').then(() => {
      dmx.rpc.deleteWorkspace(workspace.id)         // update server state
    }).then(() => {
      removeWorkspace(workspace.id)                 // update client state
      // TODO: collapse?
    }).catch(() => {})                              // suppress unhandled rejection on cancel
  },

  /**
   * @param   userModel   object w/ "displayName", "emailAddress" and "defaultLanguage" props.
   */
  createUser ({rootState}, userModel) {
    state.loading2 = true
    let p
    // update server state
    if (DEV) {
      // Note: in development mode display name is ignored and password is fixed to '123'
      p = dmx.rpc.createUserAccount(userModel.emailAddress, '123')
    } else {
      const emailAddress = userModel.emailAddress
      p = http.get(`/sign-up/username/${emailAddress}/taken`).then(response => {
        console.log('isUsernameTaken', response.data)
        if (response.data.value) {
          return Promise.reject(new Error(`Username "${emailAddress}" is already taken.`))
        } else {
          return emailAddress
        }
      }).then(emailAddress => {
        const displayName = userModel.displayName     // urlencode? Or done already by axios?
        const language = userModel.defaultLanguage
        return http.post(`/linqa/admin/user/${emailAddress}/${displayName}/${language}`)
          .then(response => response.data)            // Note: in Linqa username *is* email address
      })
    }
    // update client state
    return p.then(user => {
      rootState.users.push(user)
      rootState.users.sort(lq.topicSort)              // TODO: sort by display name (email address at the moment)
      state.selectedUser = user
      state.secondaryPanel = undefined
      scrollIntoView('lq-user-item', user.id)
    }).catch(error => {
      return lq.alertError(error)
    }).finally(() => {
      state.loading2 = false
    })
  },

  updateUser ({rootState}, userModel) {
    state.loading2 = true
    const username = userModel.emailAddress
    const displayName = userModel.displayName
    // update server state
    return http.put(`/sign-up/display-name/${username}`, undefined, {
      params: {displayName}
    }).then(() => {
      // update client state
      updateUser(username, displayName)
      // rootState.users.sort(lq.topicSort)     // TODO: sort by display name (email address at the moment)
      state.secondaryPanel = undefined
    }).catch(error => {
      return lq.alertError(error)
    }).finally(() => {
      state.loading2 = false
    })
  },

  deleteUser ({rootState}, user) {
    state.selectedUser = user
    return lq.confirmDeletion('warning.delete_user').then(() => {
      return http.delete(`/ldap/user/${user.value}`)  // update server state
    }).then(() => {
      removeUser(user.id, rootState)                  // update client state
    }).catch(() => {})                                // suppress unhandled rejection on cancel
  }
}

const getters = {
  sortedWorkspaces () {
    return state.workspaces.sort(lq.workspaceSort)
  }
}

export default {
  namespaced: true,
  state,
  actions,
  getters
}

// State helper

function findWorkspace (id) {
  const ws = state.workspaces.find(ws => ws.id === id)
  if (!ws) {
    throw Error(`Workspace ${id} not found`)
  }
  return ws
}

function removeWorkspace (id) {
  const i = state.workspaces.findIndex(ws => ws.id === id)
  if (i === -1) {
    throw Error('removeWorkspace')
  }
  state.workspaces.splice(i, 1)
}

function removeUser (id, rootState) {
  const i = rootState.users.findIndex(u => u.id === id)
  if (i === -1) {
    throw Error('removeUser')
  }
  rootState.users.splice(i, 1)
}

function addWorkspace(workspace, rootState, dispatch) {
  state.workspaces.push(new dmx.Topic(workspace))             // admin area: add to workspace list
  collapseUsers(rootState, dispatch)                          // admin area: force refetching user's memberships
  dispatch('fetchLinqaWorkspaces', undefined, {root: true})   // Linqa UI: add to current user's workspace selector
  scrollIntoView('lq-workspace-item', workspace.id)
}

function replaceWorkspace (workspace, rootState, dispatch) {
  // admin state
  let i = state.workspaces.findIndex(ws => ws.id === workspace.id)
  if (i === -1) {
    throw Error('replaceWorkspace')
  }
  state.workspaces[i] = workspace
  dispatch('fetchWorkspaceMemberships', workspace, {root: true})
  // root state
  i = rootState.workspaces.findIndex(ws => ws.id === workspace.id)
  if (i >= 0) {
    workspace.assoc = rootState.workspaces[i].assoc     // transfer membership of current user
    rootState.workspaces[i] = workspace
  }
}

function updateUser(username, displayName) {
  const children = lq.getUser(username).children
  // Note: for display_name server sends no default value, children might not be there
  if (!children['dmx.signup.display_name']) {
    children['dmx.signup.display_name'] = {}
  }
  children['dmx.signup.display_name'].value = displayName
}

/**
 * Collapses *all* items of admin area's workspace list.
 * Forces refetching a workspace's users on next expand.
 */
function collapseWorkspaces (dispatch) {
  state.workspaces.forEach(workspace => {
    delete workspace.memberships                // force refetch on next expand
    dispatch('setExpandedWorkspaceIds', [])     // TODO: don't collapse but refetch later on when needed
  })
}

/**
 * Collapses *all* items of admin area's users list.
 * Forces refetching an user's workspaces on next expand.
 */
function collapseUsers (rootState, dispatch) {
  rootState.users.forEach(user => {
    delete user.memberships                     // force refetch on next expand
    dispatch('setExpandedUsernames', [])        // TODO: don't collapse but refetch later on when needed
  })
}

// View helper

function scrollIntoView(cssClass, id) {
  nextTick(() => {
    // Regarding scrollIntoView() see comments in jumpToComment() action (linqa.js)
    document.querySelector(`.${cssClass}[data-id="${id}"]`).scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    })
  })
}
