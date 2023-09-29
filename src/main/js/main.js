import dmx from 'dmx-api'
import Vue from 'vue'
import App from './components/App'
import store from './store/linqa'
import router from './router'
import onHttpError from './error-handler'
import messageHandler from './message-handler'
import './element-ui'

console.log('[Linqa] 2023/09/29-2')

// 1) Init dmx library
dmx.init({
  topicTypes: [                   // types are needed for dmx-api form generator (type.newFormModel())
    'linqa.document',
    'linqa.note',
    'linqa.textblock',
    'linqa.heading',
    'dmx.workspaces.workspace'    // needed by admin interface
  ],
  store,
  messageHandler,
  onHttpError
})

// 2) Global component registrations (needed by several components)
Vue.component('lq-language-switch', require('./components/lq-language-switch').default)
Vue.component('lq-string',          require('./components/lq-string').default)
Vue.component('lq-truncate',        require('./components/lq-truncate').default)
Vue.component('lq-comment-ref',     require('./components/lq-comment-ref').default)
Vue.component('lq-document-ref',    require('./components/lq-document-ref').default)
Vue.component('lq-textblock-ref',   require('./components/lq-textblock-ref').default)
Vue.component('lq-attachment',      require('./components/lq-attachment').default)
Vue.component('lq-pdf-viewer',      require('./components/lq-pdf-viewer').default)
Vue.component('vue-moveable',       require('vue-moveable').default)

// 3) Create Vue root instance
new Vue({
  el: '#app',
  store,
  router,
  render: h => h(App)
})
