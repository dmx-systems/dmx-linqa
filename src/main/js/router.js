/**
 * The router: when URL changes adapt app state accordingly.
 */

import { createRouter, createWebHashHistory } from 'vue-router'
import Login from './components/lq-login'
import PasswordResetDialog from './components/lq-password-reset-dialog'
import NewPasswordDialog from './components/lq-new-password-dialog'
import Legal from './components/lq-legal'
import Webclient from './components/lq-webclient'
import Workspace from './components/lq-workspace'
import Admin from './components/admin/lq-admin'
import app from './app'
import store from './store/linqa'
import lq from './lq-globals'
import dmx from 'dmx-api'

let initialNavigation = true

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'root',
      component: Webclient,
      children: [
        {
          path: '/workspace/:workspaceId',
          name: 'workspace',
          component: Workspace
        },
        {
          path: '/admin',
          name: 'admin',
          component: Admin
        }
      ]
    },
    {
      path: '/login',
      name: 'login',
      component: Login,
      children: [
        {
          path: '/password-reset',
          name: 'passwordReset',
          component: PasswordResetDialog
        },
        {
          path: '/new-password/:emailAddress/:key',
          name: 'newPassword',
          component: NewPasswordDialog
        }
      ]
    },
    {
      path: '/imprint',
      name: 'imprint',
      component: Legal
    },
    {
      path: '/privacy_policy',
      name: 'privacy_policy',       // used directly as ui-string key component, underscore instead camel-case
      component: Legal
    }
  ]
})

router.beforeEach((to, from, next) => {
  Promise.all([store.state.userReady, store.state.langReady]).then(() => {
    if (initialNavigation) {
      initLang(to)
      initialNavigation = false
    }
    if (['passwordReset', 'newPassword', 'imprint', 'privacy_policy'].includes(to.name)) {
      next()
    } else if (store.state.username) {
      let init = true
      if (to.name === 'workspace') {
        if (isValidWorkspaceId(id(to.params.workspaceId), 'path param')) {
          next()
          init = false
        }
      } else if (to.name === 'admin') {
        if (store.state.isLinqaAdmin) {
          next()
          init = false
        } else {
          if (from.name) {
            next(false)
            init = false
          }
        }
      }
      if (init) {
        store.dispatch('getInitialWorkspaceId').then(workspaceId => {
          next({name: 'workspace', params: {workspaceId}, query: to.query})
        })
      }
    } else {
      if (to.name === 'login') {
        next()    // needed to avoid endless redirection
      } else {
        const loc = {name: 'login', query: {}}
        if (to.name === 'workspace') {
          loc.query.workspaceId = to.params.workspaceId
        }
        next(loc)
      }
    }
  }).catch(error => {
    app.config.globalProperties.$alert(error.message, {
      type: 'error',
      showClose: false
    }).then(() =>
      store.dispatch('logout')
    ).then(() => {
      next({name: 'root'})
    })
  })
})

const state = {
  router
}

const actions = {

  /**
   * @param   workspaceId   optional
   */
  callWorkspaceRoute (_, workspaceId) {
    const id = workspaceId || store.state.workspace.id
    router.push({
      name: 'workspace',
      params: {workspaceId: id},
      query: router.currentRoute.value.query
    })
  },

  callRootRoute () {
    router.push({name: 'root'})
  },

  callLoginRoute () {
    // const query = router.currentRoute.value.query     // TODO: pass worspaceId when password reset
    router.push({name: 'login' /*, query */})
  },

  callPasswordResetRoute () {
    router.push({name: 'passwordReset'})
  },

  callAdminRoute () {
    router.push({name: 'admin'})
  },

  callRoute (_, name) {
    router.push({name})
  },

  /**
   * Adds/removes query params to the current route.
   *
   * @param   query   object with query params or undefined
   */
  setRouteQuery (_, query) {
    router.push({query})
  },

  /**
   * Precondition: User state is up-to-date.
   */
  getInitialWorkspaceId () {
    // 1) take from URL (query param)
    let workspaceId = id(router.currentRoute.value.query.workspaceId)
    if (isValidWorkspaceId(workspaceId, 'query param')) {
      return workspaceId
    }
    // 2) take from cookie
    workspaceId = id(dmx.utils.getCookie('dmx_workspace_id'))
    if (isValidWorkspaceId(workspaceId, 'cookie')) {
      return workspaceId
    }
    // 3) Linqa admins land in "Linqa Administration" workspace (at first login there are no Linqa shared workspaces)
    if (store.state.isLinqaAdmin) {
      return store.state.linqaAdminWs.id
    }
    // 4) take first workspace (based on memberships)
    workspaceId = store.getters.sortedWorkspaces[0]?.id
    if (!workspaceId) {
      throw Error(lq.getString('warning.no_workspace', store.state.username))
    }
    return workspaceId
  }
}

export default router

store.registerModule('routerModule', {
  state,
  actions
})

/**
 * Adapts app state when route changes.
 */
store.watch(
  state => state.routerModule.router.currentRoute,
  (to, from) => {
    // console.log(to, from)
    if (to.name === 'workspace' && to.path !== from.path) {
      store.dispatch('setWorkspace', id(to.params.workspaceId))
    }
    const profilePane = to.query.profile
    if (profilePane !== undefined) {      // Note: empty string represents open dialog with all panes closed
      store.dispatch('openUserProfile', profilePane)
    } else if (from.query.profile !== undefined) {
      store.dispatch('closeUserProfile')
    }
  }
)

function initLang (route) {
  const langQ = route.query.lang                    // from query param
  const langC = dmx.utils.getCookie('linqa_lang')   // from cookie
  const langB = navigator.language.substr(0, 2)     // from browser setting
  const config = [store.state.lang1, store.state.lang2]
  const lang = config.includes(langQ) ? langQ :
               config.includes(langC) ? langC :
               config.includes(langB) ? langB : store.state.lang1
  console.log(`[Linqa] lang: ${lang} (query: ${langQ}, cookie: ${langC}, browser: ${langB}, config: ${config})`)
  store.dispatch('setLang', lang)
}

/**
 * Returns truish if the given ID refers to a valid workspace for the current user.
 *
 * @param   id    if undefined false is returned
 */
function isValidWorkspaceId (id, origin) {
  if (!id) {
    return false
  }
  const valid = store.state.isLinqaAdmin && id === store.state.linqaAdminWs.id || lq.findWorkspace(id)
  // console.log('isValidWorkspaceId', id, '(from ' + origin + ')', !!valid)
  if (!valid) {
    console.warn(`${id} is an invalid workspace ID for user "${store.state.username}"`)
  }
  return valid
}

/**
 * Converts the given value into Number.
 *
 * @return  the number, or undefined if `undefined`/`null` is given.
 *          Never returns `null`.
 *
 * @throws  if the given value is not one of Number/String/undefined/null.
 */
function id (v) {
  // Note: Number(undefined) is NaN, and NaN != NaN is true!
  // Note: dmx.utils.getCookie may return null, and Number(null) is 0 (and typeof null is 'object')
  if (typeof v === 'number') {
    return v
  } else if (typeof v === 'string') {
    return Number(v)
  } else if (v !== undefined && v !== null) {
    throw Error(`Expecting one of [number|string|undefined|null], got ${v}`)
  }
}
