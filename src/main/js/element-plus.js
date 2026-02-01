import { ElMessageBox, ElNotification } from 'element-plus'
import {
  Close, Paperclip, Edit, DocumentCopy, Lock, Unlock, DeleteFilled, Download, UploadFilled, Setting, BrushFilled, Flag,
  ArrowLeft, ArrowRight, Right, Bottom, TopRight, BottomLeft
} from '@element-plus/icons-vue'
import 'element-plus/theme-chalk/el-message-box.css'
import 'element-plus/theme-chalk/el-notification.css'
import app from './app'

// set locale     // TODO?
// import locale from 'element-plus/lib/locale'
// locale.use(require('element-plus/lib/locale/lang/en').default)

app.use(ElMessageBox)
app.use(ElNotification)

app.component('Close', Close)
app.component('Paperclip', Paperclip)
app.component('Edit', Edit)
app.component('DocumentCopy', DocumentCopy)
app.component('Lock', Lock)
app.component('Unlock', Unlock)
app.component('DeleteFilled', DeleteFilled)
app.component('Download', Download)
app.component('UploadFilled', UploadFilled)
app.component('Setting', Setting)
app.component('BrushFilled', BrushFilled)
app.component('Flag', Flag)
app.component('ArrowLeft', ArrowLeft)
app.component('ArrowRight', ArrowRight)
app.component('Right', Right)
app.component('Bottom', Bottom)
app.component('TopRight', TopRight)
app.component('BottomLeft', BottomLeft)
