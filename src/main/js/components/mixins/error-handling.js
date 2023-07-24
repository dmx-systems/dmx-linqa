import lq from '../../lq-globals'
import errorHandler from '../../error-handler'

export default {
  methods: {
    /**
     * @param   msgBox    Optional: 'confirm'/'alert'
     */
    handleError (error, msgBox) {
      const message = /java\.lang\.RuntimeException: Unsupported original language: ".." \(detected\)/
      if (error.response.data.cause.match(message)) {
        switch (msgBox) {
        case 'confirm':
          return this.$confirm(lq.getString('warning.translation_confirm'), {
            type: 'warning',
            title:             lq.getString('warning.translation_failed'),
            confirmButtonText: lq.getString('action.create'),
            cancelButtonText:  lq.getString('action.cancel'),
            showClose: false,
          })
        case 'alert':
          return this.$alert(  lq.getString('warning.translation_alert'), {
            title:             lq.getString('warning.translation_failed'),
            type: 'warning',
            showClose: false,
          })
        }
      }
      errorHandler(error)         // fallback to generic error handler
    }
  }
}
