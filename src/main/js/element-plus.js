import { ElLoading, ElMessageBox, ElNotification } from 'element-plus'
import {
  CirclePlusFilled, HomeFilled, FullScreen, ZoomIn, ZoomOut, ChatLineRound, Close, Paperclip, Promotion
} from '@element-plus/icons-vue'
// import locale from 'element-plus/lib/locale'   // TODO
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

app.component('CirclePlusFilled', CirclePlusFilled)
app.component('HomeFilled', HomeFilled)
app.component('FullScreen', FullScreen)
app.component('ZoomIn', ZoomIn)
app.component('ZoomOut', ZoomOut)
app.component('ChatLineRound', ChatLineRound)
app.component('Close', Close)
app.component('Paperclip', Paperclip)
app.component('Promotion', Promotion)
