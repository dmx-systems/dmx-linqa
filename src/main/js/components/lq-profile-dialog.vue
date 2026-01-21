<template>
  <!-- v-loading does not work on el-dialog. So we put it on a child element. -->
  <!-- https://github.com/element-plus/element-plus/issues/6706 -->
  <el-dialog class="lq-profile-dialog" v-model="profileVisibility" width="400px">
    <template #header>
      <div>
        <lq-string>label.user_profile</lq-string>:&nbsp;&nbsp;<b>{{username}}</b>
      </div>
    </template>
    <el-collapse accordion v-model="profilePane" v-loading="loading">
      <el-collapse-item name="privacy">
        <template #title>
          <lq-string>label.privacy</lq-string>
        </template>
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
        <template #title>
          <lq-string>label.notifications</lq-string>
        </template>
        <el-radio-group class="notification-level field" v-model="notificationLevel">
          <el-radio value="all">
            <lq-string>label.notifications.all</lq-string>
            <lq-string class="label">label.notifications.all.info</lq-string>
          </el-radio>
          <el-radio value="mentioned">
            <lq-string>label.notifications.mentioned</lq-string>
            <lq-string class="label">label.notifications.mentioned.info</lq-string>
          </el-radio>
          <el-radio value="none">
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
        <template #title>
          <lq-string>label.password</lq-string>
        </template>
        <el-button type="primary" @click="changePassword">
          <lq-string>action.change_password</lq-string>
        </el-button>
      </el-collapse-item>
    </el-collapse>
  </el-dialog>
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
      return this.presentationMode ? 'check' : ''     // el-dropdown-item strictly expects string (or component)
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
.lq-profile-dialog .el-dialog .el-radio {
  line-height: 1;         /* Avoid inheriting 1.769 from .el-collapse-item__content */
  height: unset;          /* Element Plus default for el-radio is 32px */
  align-items: unset;     /* Element Plus default for el-radio is "center" */
  white-space: unset;     /* Element Plus default for el-radio is "nowrap" */
}

.lq-profile-dialog .el-dialog .el-radio + .el-radio {
  margin-top: var(--field-spacing);
}

.lq-profile-dialog .el-dialog .el-radio .label {
  display: block;
  margin-top: 6px;
  line-height: 1.2;
}
</style>
