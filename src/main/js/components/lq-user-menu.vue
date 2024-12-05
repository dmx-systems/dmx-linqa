<template>
  <div class="lq-user-menu">
    <el-dropdown size="medium" trigger="click" @command="handle">
      <el-button type="text" class="fa fa-user-circle">
        <span class="el-icon-arrow-down el-icon--right"></span>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item disabled>
            <b>{{username}}</b>
          </el-dropdown-item>
          <el-dropdown-item command="openUserProfile">
            <lq-string>label.user_profile</lq-string>
          </el-dropdown-item>
          <el-dropdown-item command="togglePresentationMode" v-if="isAuthor" :icon="icon" divided>
            <lq-string>label.presentation_mode</lq-string>
          </el-dropdown-item>
          <el-dropdown-item command="logout" divided>
            Logout
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <el-dialog v-model="profileVisibility" width="400px" v-loading="loading">
      <template #header>
        <div>
          <lq-string>label.user_profile</lq-string>:&nbsp;&nbsp;<b>{{username}}</b>
        </div>
      </template>
      <el-collapse v-model="profilePane" accordion>
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
            <el-button type="primary" @click="saveUserProfile">
              <lq-string>action.submit</lq-string>
            </el-button>
          </div>
        </el-collapse-item>
        <el-collapse-item name="notifications">
          <lq-string slot="title">label.notifications</lq-string>
          <el-radio-group class="notification-level field" v-model="notificationLevel">
            <el-radio label="all">
              <lq-string>label.notifications.all</lq-string>
              <lq-string class="label">label.notifications.all.info</lq-string>
            </el-radio>
            <el-radio label="mentioned">
              <lq-string>label.notifications.mentioned</lq-string>
              <lq-string class="label">label.notifications.mentioned.info</lq-string>
            </el-radio>
            <el-radio label="none">
              <lq-string>label.notifications.none</lq-string>
              <lq-string class="label">label.notifications.none.info</lq-string>
            </el-radio>
          </el-radio-group>
          <div class="field">
            <el-button type="primary" @click="saveUserProfile">
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

  created () {
    // init local state for user profile dialog
    this.displayName = lq.getDisplayName(this.username)
    this.showEmailAddress = lq.getShowEmailAddress(this.username)
    this.notificationLevel = lq.getUser(this.username).children['linqa.notification_level']?.value || 'mentioned'
  },

  data () {
    return {
      // user profile dialog
      loading: false,
      displayName: '',
      showEmailAddress: false,
      notificationLevel: ''
    }
  },

  computed: {

    username () {
      return this.$store.state.username
    },

    profileVisibility: {
      get () {
        return this.$store.state.profileVisibility
      },
      set (profileVisibility) {
        if (!profileVisibility) {
          this.$store.dispatch('setRouteQuery')   // remove query params
        } else {
          // never happens, visibility=true is only done in global state, not on local computed state
          throw Error('setting user profile visibility to ' + profileVisibility)
        }
      }
    },

    profilePane: {
      get () {
        return this.$store.state.profilePane
      },
      set (profilePane) {
        this.$store.dispatch('setRouteQuery', {profile: profilePane})
      }
    },

    icon () {
      return this.presentationMode ? 'el-icon-check' : ''     // el-dropdown-item strictly expects string
    }
  },

  methods: {

    handle (command) {
      this[command]()
    },

    openUserProfile () {
      this.$store.dispatch('setRouteQuery', {profile: this.profilePane})
    },

    saveUserProfile () {
      this.loading = true
      this.$store.dispatch('updateUserProfile', {
        displayName: this.displayName,
        showEmailAddress: this.showEmailAddress,
        notificationLevel: this.notificationLevel
      }).catch(error => {
        return this.$alert(error.message, {
          type: 'error',
          showClose: false
        })
      }).finally(() => {
        this.loading = false
        this.profileVisibility = false
      })
    },

    togglePresentationMode () {
      this.$store.dispatch('togglePresentationMode')
    },

    logout () {
      this.$store.dispatch('logout').then(() =>
        this.$store.dispatch('callRootRoute')
      )
    },

    changePassword () {
      this.loading = true
      this.$store.dispatch('resetPassword', this.username).finally(() => {
        this.loading = false
        this.profileVisibility = false
      })
    }
  }
}
</script>

<style>
.lq-user-menu .el-dialog .el-radio + .el-radio {
  margin-top: 15px;
}

.lq-user-menu .el-dialog .el-radio .label {
  display: block;
  margin-left: 24px;
  white-space: normal;    /* el-radio sets nowrap */
  word-break: normal;     /* el-dialog__body sets break-all */
}
</style>
