<template>
  <div class="lq-user-form">
    <div class="heading"><lq-string>{{heading}}</lq-string></div>
    <div class="field">
      <div class="field-label"><lq-string>label.display_name</lq-string></div>
      <el-input v-model="model.displayName"></el-input>
    </div>
    <div class="field">
      <div class="field-label"><lq-string>label.email_address</lq-string></div>
      <el-input v-model="model.emailAddress" :disabled="isUpdate"></el-input>
    </div>
    <div class="field" v-if="!isUpdate">
      <div class="field-label"><lq-string>label.default_language</lq-string></div>
      <lq-language-switch v-model="model.defaultLanguage"></lq-language-switch>
    </div>
    <el-button class="submit-button" type="primary" size="medium" :disabled="isIncomplete" @click="submit">
      <lq-string>action.submit</lq-string>
    </el-button>
    <el-button size="medium" @click="clearSecondaryPanel">
      <lq-string>action.cancel</lq-string>
    </el-button>
  </div>
</template>

<script>
import lq from '../../lq-globals'

export default {

  mixins: [
    require('./mixins/admin-util').default
  ],

  created () {
    if (this.isUpdate) {
      const username = this.selectedUser.value
      this.model.emailAddress = username
      this.model.displayName = lq.getDisplayName(username)
    } else {
      this.model.defaultLanguage = this.lang
    }
  },

  data () {
    return {
      model: {
        displayName: '',
        emailAddress: '',
        defaultLanguage: ''
      }
    }
  },

  computed: {

    heading () {
      return this.isUpdate ? 'label.edit_user' : 'label.new_user'
    },

    isUpdate () {
      return this.formMode === 'update'
    },

    isIncomplete () {
      return !this.model.displayName || !this.model.emailAddress
    },

    formMode () {
      return this.$store.state.admin.formMode
    },

    selectedUser () {
      return this.$store.state.admin.selectedUser
    },

    lang () {
      return this.$store.state.lang
    }
  },

  methods: {
    submit () {
      this.$emit('loading')
      let action = this.isUpdate ? 'admin/updateUser' : 'admin/createUser'
      this.$store.dispatch(action, this.model).then(() => {
        this.$emit('complete')    // must emit *before* removing this panel
        this.clearSecondaryPanel()
      }).catch(error => {
        this.$alert(error.message, {
          type: 'error',
          showClose: false
        }).then(() => {
          this.$emit('complete')
        })
      })
    }
  }
}
</script>
