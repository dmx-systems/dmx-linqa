import dmx from 'dmx-api'
import { defineAsyncComponent } from 'vue'
import store from './store/linqa'
import router from './router'
import onHttpError from './error-handler'
import messageHandler from './message-handler'
import app from './app'
import './element-plus'
import './country-flag-polyfill'

console.log('[Linqa] 2026/01/12-gev-2')

// 1) Init DMX library
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

// 2) register assets and mount root component
app.component('lq-language-switch', require('./components/lq-language-switch').default)
app.component('lq-string',          require('./components/lq-string').default)
app.component('lq-truncate',        require('./components/lq-truncate').default)
app.component('lq-comment-ref',     require('./components/lq-comment-ref').default)
app.component('lq-document-ref',    require('./components/lq-document-ref').default)
app.component('lq-note-ref',        require('./components/lq-note-ref').default)
app.component('lq-textblock-ref',   require('./components/lq-textblock-ref').default)
app.component('lq-attachment',      require('./components/lq-attachment').default)
app.component('lq-about-dialog',    require('./components/lq-about-dialog').default)
app.component('vue-moveable',       require('vue3-moveable').default)
app.component('quill',              require('vue-quill-minimum').default)
// load PDF viewer on-demand
app.component('lq-pdf-viewer', defineAsyncComponent(() => import('./components/lq-pdf-viewer')))

app.use(store)
app.use(router)

app.mount('body')
