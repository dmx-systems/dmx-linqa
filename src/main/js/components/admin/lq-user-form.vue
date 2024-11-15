<template>
  <div class="lq-user-form" :key="!!user">
    <div class="heading"><lq-string>{{heading}}</lq-string></div>
    <div class="field">
      <div class="field-label"><lq-string>label.display_name</lq-string></div>
      <el-input v-model="model.displayName"></el-input>
    </div>
    <div class="field">
      <div class="field-label"><lq-string>label.email_address</lq-string></div>
      <el-input v-model="model.emailAddress" :disabled="!!user"></el-input>
    </div>
    <div class="field" v-if="!user">
      <div class="field-label"><lq-string>label.default_language</lq-string></div>
      <lq-language-switch v-model="model.defaultLanguage"></lq-language-switch>
    </div>
    <el-button class="submit-button" type="primary" size="medium" :disabled="isIncomplete" @click="submit">
      <lq-string>action.submit</lq-string>
    </el-button>
    <el-button size="medium" @click="cancel">
      <lq-string>action.cancel</lq-string>
    </el-button>
  </div>
</template>

<script>
import lq from '../../lq-globals'

export default {

  mixins: [
    require('./mixins/cancel').default
  ],

  created () {
    this.initModel()
  },

  data () {
    return {
      model: {
        displayName: undefined,       // String
        emailAddress: undefined,      // String
        defaultLanguage: undefined    // String
      }
    }
  },

  computed: {

    user () {
      return this.$store.state.admin.selectedUser
    },

    heading () {
      return this.user ? 'label.edit_user' : 'label.new_user'
    },

    isIncomplete () {
      return !this.model.displayName || !this.model.emailAddress
    },

    lang () {
      return this.$store.state.lang
    }
  },

  watch: {
    user () {
      this.initModel()
    }
  },

  methods: {

    initModel () {
      if (this.user) {
        const username = this.user.value
        this.model.displayName = lq.getDisplayName(username)
        this.model.emailAddress = username
      } else {
        this.model.displayName = ''
        this.model.emailAddress = ''
        this.model.defaultLanguage = this.lang
      }
    },

    submit () {
      let action = this.user ? 'admin/updateUser' : 'admin/createUser'
      this.$store.dispatch(action, this.model)
    }
  }
}
</script>
