import dmx from 'dmx-api'
import { createApp } from 'vue'
import App from './components/App'
import store from './store/linqa'
import router from './router'
import onHttpError from './error-handler'
import messageHandler from './message-handler'
import './element-ui'
import './country-flag-polyfill'

console.log('[Linqa] 2024/12/01-2')

// 1) Init dmx library
dmx.init({
  topicTypes: [                   // types are needed for dmx-api form generator (type.newFormModel())
    'linqa.document',
    'linqa.note',
    'linqa.textblock',
    'linqa.heading',
    'linqa.shape',
    'linqa.line',
    'dmx.workspaces.workspace'    // needed by admin interface
  ],
  store,
  messageHandler,
  onHttpError
})

// 2) Create app instance
const app = createApp(App)
app.mount('#app')

/* TODO: store, router
new Vue({
  el: '#app',
  store,
  router,
  render: h => h(App)
}) */

// 3) app-wide component registrations (needed by several components)
app.component('lq-language-switch', require('./components/lq-language-switch').default)
app.component('lq-string',          require('./components/lq-string').default)
app.component('lq-truncate',        require('./components/lq-truncate').default)
app.component('lq-comment-ref',     require('./components/lq-comment-ref').default)
app.component('lq-document-ref',    require('./components/lq-document-ref').default)
app.component('lq-textblock-ref',   require('./components/lq-textblock-ref').default)
app.component('lq-attachment',      require('./components/lq-attachment').default)
app.component('lq-pdf-viewer',      require('./components/lq-pdf-viewer').default)
app.component('lq-about-dialog',    require('./components/lq-about-dialog').default)
app.component('vue-moveable',       require('vue-moveable').default)
app.component('quill',              require('vue-quill-minimum').default)
