<template>
  <div class="lq-user-menu">
    <el-dropdown size="medium" trigger="click" @command="handle">
      <el-button type="text" class="fa fa-user-circle">
        <span class="el-icon-arrow-down el-icon--right"></span>
      </el-button>
      <el-dropdown-menu slot="dropdown">
        <el-dropdown-item command="userProfile">
          <b>{{username}}</b>
        </el-dropdown-item>
        <el-dropdown-item v-if="isAuthor" command="togglePresentationMode" :icon="icon" divided>
          <lq-string>label.presentation_mode</lq-string>
        </el-dropdown-item>
        <el-dropdown-item command="logout" divided>
          Logout
        </el-dropdown-item>
      </el-dropdown-menu>
    </el-dropdown>
    <el-dialog :visible.sync="visible" width="400px" v-loading="loading">
      <div slot="title">
        <lq-string>label.user_profile</lq-string>:&nbsp;&nbsp;<b>{{username}}</b>
      </div>
      <el-collapse v-model="expandedItems" accordion>
        <el-collapse-item name="privacy">
          <lq-string slot="title">label.privacy</lq-string>
          <div class="field">
            <div class="field-label"><lq-string>label.display_name</lq-string></div>
            <el-input v-model="displayName"></el-input>
          </div>
          <el-checkbox class="field" v-model="showEmailAddress">
            <lq-string>label.show_email_address</lq-string>
          </el-checkbox>
          <div class="field">
            <el-button type="primary" @click="save">
              <lq-string>action.submit</lq-string>
            </el-button>
          </div>
        </el-collapse-item>
        <el-collapse-item name="password">
          <lq-string slot="title">label.password</lq-string>
          <el-button type="primary" @click="changePassword">
            <lq-string>action.change_password</lq-string>
          </el-button>
        </el-collapse-item>
      </el-collapse>
    </el-dialog>
  </div>
</template>

<script>
import lq from '../lq-globals'

export default {

  mixins: [
    require('./mixins/presentation-mode').default,
    require('./mixins/roles').default
  ],

  data () {
    return {
      expandedItems: ['privacy'],
      // User Profile dialog
      visible: false,
      loading: false,
      displayName: '',
      showEmailAddress: false
    }
  },

  computed: {

    username () {
      return this.$store.state.username
    },

    icon () {
      return this.presentationMode && 'el-icon-check'
    }
  },

  methods: {

    handle (command) {
      this[command]()
    },

    userProfile () {
      this.visible = true
      this.displayName = lq.getDisplayName(this.username)
      this.showEmailAddress = lq.getShowEmailAddress(this.username)
    },

    togglePresentationMode () {
      this.$store.dispatch('togglePresentationMode')
    },

    logout () {
      this.$store.dispatch('logout').then(() =>
        this.$store.dispatch('callRootRoute')
      )
    },

    save () {
      this.loading = true
      this.$store.dispatch('updateUserProfile', {
        displayName: this.displayName,
        showEmailAddress: this.showEmailAddress
      }).catch(error => {
        return this.$alert(error.message, {
          type: 'error',
          showClose: false
        })
      }).finally(() => {
        this.loading = false
        this.visible = false
      })
    },

    changePassword () {
      this.loading = true
      this.$store.dispatch('resetPassword', this.username).finally(() => {
        this.loading = false
        this.visible = false
      })
    }
  }
}
</script>
