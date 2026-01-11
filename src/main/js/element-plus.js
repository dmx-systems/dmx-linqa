import { ElMessageBox, ElNotification } from 'element-plus'
import {
  CirclePlusFilled, HomeFilled, FullScreen, ZoomIn, ZoomOut, ChatLineRound, Close, Paperclip, Promotion,
  Edit, DocumentCopy, Lock, Unlock, DeleteFilled, Download, Setting, BrushFilled, Flag,
  ArrowLeft, ArrowRight, ArrowDownBold, Right, Bottom, TopRight, BottomLeft, Check
} from '@element-plus/icons-vue'
import 'element-plus/theme-chalk/el-message-box.css'
import 'element-plus/theme-chalk/el-notification.css'
import app from './app'

// set locale     // TODO?
// import locale from 'element-plus/lib/locale'
// locale.use(require('element-plus/lib/locale/lang/en').default)

app.use(ElMessageBox)
app.use(ElNotification)

app.component('CirclePlusFilled', CirclePlusFilled)
app.component('HomeFilled', HomeFilled)
app.component('FullScreen', FullScreen)
app.component('ZoomIn', ZoomIn)
app.component('ZoomOut', ZoomOut)
app.component('ChatLineRound', ChatLineRound)
app.component('Close', Close)
app.component('Paperclip', Paperclip)
app.component('Promotion', Promotion)
app.component('Edit', Edit)
app.component('DocumentCopy', DocumentCopy)
app.component('Lock', Lock)
app.component('Unlock', Unlock)
app.component('DeleteFilled', DeleteFilled)
app.component('Download', Download)
app.component('Setting', Setting)
app.component('BrushFilled', BrushFilled)
app.component('Flag', Flag)
app.component('ArrowLeft', ArrowLeft)
app.component('ArrowRight', ArrowRight)
app.component('ArrowDownBold', ArrowDownBold)
app.component('Right', Right)
app.component('Bottom', Bottom)
app.component('TopRight', TopRight)
app.component('BottomLeft', BottomLeft)
app.component('Check', Check)
