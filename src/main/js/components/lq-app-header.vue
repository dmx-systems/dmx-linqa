<template>
  <div :class="['lq-app-header', {'small-screen': isSmallScreen}]">
    <img class="logo" :src="logo(true)">
    <!-- Workspace selector -->
    <div class="workspace">
      <lq-string v-if="isAdminRoute" class="name" key="admin">label.admin</lq-string>
      <el-dropdown v-else trigger="click" max-height="calc(100vh - 68px)" @command="setWorkspace">
        <span class="el-dropdown-link">{{workspaceName}}
          <el-icon size="large" class="fa fa-caret-down"></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item v-for="workspace in workspaces" :command="workspace.id" :key="workspace.id">
              {{getWorkspaceName(workspace)}}
            </el-dropdown-item>
            <el-dropdown-item v-if="isLinqaAdmin && linqaAdminWs" :command="linqaAdminWs.id"
                :divided="workspacesExist">
              {{getWorkspaceName(linqaAdminWs)}}
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <template v-if="!isAdminRoute">
      <template v-if="isBigScreen">
        <lq-canvas-search></lq-canvas-search>
      </template>
      <template v-else>
        <el-button class="search-button fa fa-search" type="primary" link :title="searchTooltip"
          @click="dialogVisible = true">
        </el-button>
        <el-dialog top="50vh" width="80%" v-model="dialogVisible">
          <lq-canvas-search></lq-canvas-search>
        </el-dialog>
      </template>
    </template>
    <lq-language-switch></lq-language-switch>
    <lq-account-menu></lq-account-menu>
    <el-dropdown trigger="click" @command="handle">
      <el-button class="burger-button fa fa-bars" type="primary" link></el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <div class="el-dropdown-item lq-burger">
            <b>{{username}}</b>
          </div>
          <el-dropdown-item command="openUserProfile" divided>
            <el-icon size="large" class="fa fa-user"></el-icon>
            <lq-string>label.user_profile</lq-string>
          </el-dropdown-item>
          <el-dropdown-item command="admin" v-if="isLinqaAdmin">
            <el-icon size="large" class="fa fa-cog"></el-icon>
            <lq-string>tooltip.admin</lq-string>
          </el-dropdown-item>
          <el-dropdown-item command="togglePresentationMode" v-if="isAuthor" divided>
            <el-icon v-if="presentationMode" size="large" :style="presentationModeStyle" class="fa fa-laptop">
            </el-icon>
            <el-icon v-else size="large" :style="presentationModeStyle" class="fa fa-eye"></el-icon>
            <lq-string :style="presentationModeStyle">label.presentation_mode</lq-string>
          </el-dropdown-item>
          <el-dropdown-item command="openHelp" divided>
            <el-icon size="large" class="fa fa-exclamation-circle"></el-icon>
            <lq-string>label.help</lq-string>
          </el-dropdown-item>
          <el-dropdown-item command="openAbout" divided>
            <el-icon size="large" class="fa fa-info"></el-icon>
            <lq-string>label.about</lq-string>
          </el-dropdown-item>
          <el-dropdown-item command="openImprint">
            <el-icon size="large" class="fa fa-file-text"></el-icon>
            <lq-string>label.imprint</lq-string>
          </el-dropdown-item>
          <el-dropdown-item command="openPrivacyPolicy">
            <el-icon size="large" class="fa fa-shield"></el-icon>
            <lq-string>label.privacy_policy</lq-string>
          </el-dropdown-item>
          <el-dropdown-item command="logout" divided>
            <el-icon size="large" class="fa fa-sign-out"></el-icon>
            Logout
          </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <lq-help-dialog :visible="helpVisible" :firstLogin="firstLogin" @close="closeHelp"></lq-help-dialog>
    <lq-about-dialog></lq-about-dialog>
  </div>
</template>

<script>
import lq from '../lq-globals'
import dmx from 'dmx-api'

export default {

  mixins: [
    require('./mixins/logo').default,
    require('./mixins/workspace-name').default,
    require('./mixins/screen').default,
    require('./mixins/presentation-mode').default,
    require('./mixins/roles').default
  ],

  data () {
    const onboarded = dmx.utils.getCookie('linqa_onboarded')
    if (!onboarded) {
      dmx.utils.setCookie('linqa_onboarded', true)
    }
    return {
      helpVisible: !onboarded && this.isBigScreen,
      firstLogin: !onboarded,
      dialogVisible: false  // search dialog
    }
  },

  props: {
    visible: Boolean
  },

  computed: {

    username () {
      return this.$store.state.username
    },

    workspacesExist () {
      return this.workspaces.length > 0
    },

    linqaAdminWs () {
      return this.$store.state.linqaAdminWs
    },

    workspaces () {
      return this.$store.getters.sortedWorkspaces
    },

    isLinqaAdmin () {
      return this.$store.state.isLinqaAdmin
    },

    workspace () {
      return this.$store.state.workspace
    },

    router () {
      return this.$store.state.routerModule.router
    },

    isAdminRoute () {
      return this.router.currentRoute.name === 'admin'
    },

    selectTooltip () {
      return lq.getString('tooltip.select_workspace')
    },

    adminTooltip () {
      return lq.getString('tooltip.admin')
    },

    searchTooltip () {
      return lq.getString('label.search')
    },

    presentationMode () {
      return this.$store.state.presentationMode
    },

    presentationModeStyle () {
      if (this.presentationMode) {
        return 'color: #c05c51'
      } else {
        return 'color: rgb(96, 98, 102)'
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
  },

  methods: {

    handle (command) {
      this[command]()
    },

    setWorkspace (id) {
      this.$store.dispatch('callWorkspaceRoute', id)
    },

    admin () {
      this.$store.dispatch('callAdminRoute')
    },

    openInfo (info) {
      this[info]()
    },

    openHelp () {
      this.helpVisible = true
    },

    closeHelp () {
      this.helpVisible = false
    },

    openAbout () {
      this.$store.dispatch('openAboutDialog')
    },

    openImprint () {
      this.$store.dispatch('callRoute', 'imprint')
    },

    openPrivacyPolicy () {
      this.$store.dispatch('callRoute', 'privacy_policy')
    },

    togglePresentationMode () {
      this.$store.dispatch('togglePresentationMode')
    },

    openUserProfile () {
      this.$store.dispatch('setRouteQuery', {profile: this.profilePane})
    },

    logout () {
      this.$store.dispatch('logout').then(() =>
        this.$store.dispatch('callRootRoute')
      )
    },
  },

  components: {
    'lq-account-menu': require('./lq-account-menu').default,
    'lq-help-dialog': require('./lq-help-dialog').default,
    'lq-canvas-search': require('./lq-canvas-search').default
  }
}
</script>

<style>
.lq-app-header {
  display: flex;
  align-items: center;
  gap: 15px;
  flex: none;
  z-index: 2;     /* place app header (help dialog) before resizer (disussion panel, 0) and before canvas toolbar (1) */
  padding: 0px 10px;
  background-color: var(--header-color);
  box-shadow: 1px 3px 6px -3px rgba(219,219,219,0.75);
  -webkit-box-shadow: 1px 3px 6px -3px rgba(219,219,219,0.75);
  -moz-box-shadow: 1px 3px 6px -3px rgba(219,219,219,0.75);
}

.lq-app-header img.logo {
  height: 70px;
}

.lq-app-header .workspace {
  flex-grow: 1;
  overflow: hidden;     /* clip workspace selector in favor of other header buttons */
  text-align: left;
}

.lq-app-header .el-dropdown-link {
  cursor: pointer;
  color: var(--el-color-primary);
  font-weight: bolder;
  display: inline;
  align-items: center;
}

.lq-app-header.small-screen .workspace .selector-label {
  display: none;
}

.lq-app-header .workspace .name {
  font-weight: bold;
}

.lq-app-header .burger-button {
  font-size: 22px;
}

.lq-app-header .search-button {
  font-size: 22px;
}

.lq-burger {
  margin: 15px;
  font-size: 15px; 
  color: var(--primary-color);
}

.lq-menu-small-middle .el-dropdown button {
  font-size: 20px;
}

.lq-menu-small-middle .el-dropdown span {
  color: var(--primary-color);
}

@media only screen and (max-width: 420px) {

  .lq-app-header .workspace .el-button > span {
    max-width: 110px;
    overflow: hidden;
    text-overflow: ellipsis;
    display: block;
  }

  .lq-app-header .workspace {
    flex-wrap: wrap-reverse;
  }

  .lq-app-header .el-dropdown-link {
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 90px;
  }
}

</style>
