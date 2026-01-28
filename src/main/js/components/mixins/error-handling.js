import lq from '../../lq-globals'
import errorHandler from '../../error-handler'

export default {
  methods: {
    /**
     * @param   msgBox    Optional: 'confirm'/'alert'
     */
    handleError (error, msgBox) {
      // language code can consist of more then 2 letters and can contain dash e.g. "pt-br"
      const message = /java\.lang\.RuntimeException: Unsupported original language: "[a-z-]*" \(detected\)/
      if (error.response.data.cause.match(message)) {
        switch (msgBox) {
        case 'confirm':
          return this.$confirm(lq.getString('warning.translation_confirm'), {
            type: 'warning',
            title:             lq.getString('warning'),
            confirmButtonText: lq.getString('action.save_without_translation'),
            cancelButtonText:  lq.getString('action.continue_editing'),
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
