import dmx from 'dmx-api'
import app from './app'
import store from './store/linqa'
import router from './router'
import onHttpError from './error-handler'
import messageHandler from './message-handler'
import './element-ui'
import './country-flag-polyfill'

console.log('[Linqa] 2024/12/01-2')

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

// 2) Mount root component
app.mount('#app')
