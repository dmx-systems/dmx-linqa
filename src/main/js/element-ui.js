import { ElLoading, ElMessageBox, ElNotification } from 'element-plus'
// import locale from 'element-plus/lib/locale'   // TODO
import DialogDraggable from 'vue-element-dialog-draggable'  // TODO
import app from './app'

// set locale                                     // TODO
// locale.use(require('element-plus/lib/locale/lang/en').default)

// Vue.use(ElLoading.directive)   // TODO

app.config.globalProperties = {
  $msgbox:  ElMessageBox,
  $alert:   ElMessageBox.alert,
  $confirm: ElMessageBox.confirm,
  $prompt:  ElMessageBox.prompt,
  $notify:  ElNotification
}
