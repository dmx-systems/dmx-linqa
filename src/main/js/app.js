import { createApp } from 'vue'
import App from './components/App'

const app = createApp(App)

/* TODO: store, router
new Vue({
  el: '#app',
  store,
  router,
  render: h => h(App)
}) */

// app-wide component registrations (needed by several components)
app.component('lq-language-switch', require('./components/lq-language-switch').default)
app.component('lq-string',          require('./components/lq-string').default)
app.component('lq-truncate',        require('./components/lq-truncate').default)
app.component('lq-comment-ref',     require('./components/lq-comment-ref').default)
app.component('lq-document-ref',    require('./components/lq-document-ref').default)
app.component('lq-textblock-ref',   require('./components/lq-textblock-ref').default)
app.component('lq-attachment',      require('./components/lq-attachment').default)
app.component('lq-pdf-viewer',      require('./components/lq-pdf-viewer').default)
app.component('lq-about-dialog',    require('./components/lq-about-dialog').default)
app.component('vue-moveable',       require('vue3-moveable').default)
app.component('quill',              require('vue-quill-minimum').default)

export default app
