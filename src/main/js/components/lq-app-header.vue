<template>
  <div :class="['lq-app-header', {'small-screen': isSmallScreen}]">
    <img class="logo" :src="logo(true)">
    <!-- Workspace selector -->
    <div class="workspace">
      <lq-string v-if="isAdminRoute" class="name" key="admin">label.admin</lq-string>
      <template v-else>
        <span class="selector-label"><lq-string>label.shared_workspace</lq-string>:</span>
        <el-dropdown size="medium" trigger="click" @command="setWorkspace">
          <el-button type="text" :title="selectTooltip">
            <span class="name">{{workspaceName}}</span><span class="el-icon-arrow-down el-icon--right"></span>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu class="lq-workspace-selector">
              <el-dropdown-item v-for="workspace in workspaces" :command="workspace.id" :key="workspace.id">
                <div>{{getWorkspaceName(workspace)}}</div>
              </el-dropdown-item>
              <el-dropdown-item v-if="isLinqaAdmin && linqaAdminWs" :command="linqaAdminWs.id" :divided="workspacesExist">
                <div>{{getWorkspaceName(linqaAdminWs)}}</div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </template>
    </div>
    <el-button class="admin-button fa fa-wrench" v-if="isLinqaAdmin" type="text" :title="adminTooltip" @click="admin">
    </el-button>
    <el-dropdown class="info-menu" v-if="isBigScreen" size="medium" trigger="click" @command="openInfo">
      <el-button class="fa fa-info-circle" type="text">
        <span class="el-icon-arrow-down el-icon--right"></span>
      </el-button>
      <template #dropdown>
        <el-dropdown-menu>
          <el-dropdown-item command="openHelp"><lq-string>label.help</lq-string></el-dropdown-item>
          <el-dropdown-item command="openAbout" divided><lq-string>label.about</lq-string></el-dropdown-item>
          <el-dropdown-item command="openImprint"><lq-string>label.imprint</lq-string></el-dropdown-item>
          <el-dropdown-item command="openPrivacyPolicy"><lq-string>label.privacy_policy</lq-string></el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
    <lq-language-switch></lq-language-switch>
    <lq-user-menu></lq-user-menu>
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
    require('./mixins/screen').default
  ],

  data () {
    const onboarded = dmx.utils.getCookie('linqa_onboarded')
    if (!onboarded) {
      dmx.utils.setCookie('linqa_onboarded', true)
    }
    return {
      helpVisible: !onboarded && this.isBigScreen,
      firstLogin: !onboarded
    }
  },

  computed: {

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
    }
  },

  methods: {

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
    }
  },

  components: {
    'lq-user-menu': require('./lq-user-menu').default,
    'lq-help-dialog': require('./lq-help-dialog').default
  }
}
</script>

<style>
.lq-app-header {
  display: flex;
  align-items: center;
  flex: none;
  padding: 2px 10px;
  background-color: var(--header-color);
}

.lq-app-header img.logo {
  height: 44px;
}

.lq-app-header .workspace {
  flex-grow: 1;
  overflow: hidden;     /* clip workspace selector in favor of other header buttons */
  text-align: center;
  color: white;
  margin: 0 20px;       /* a padding would be overflown by content */
}

.lq-app-header.small-screen .workspace .selector-label {
  display: none;
}

.lq-app-header .workspace .name {
  font-weight: bold;
  font-style: italic;
}

.lq-app-header .admin-button {
  margin-right: 20px;
}

.lq-app-header .info-menu,
.lq-app-header .lq-language-switch {
  margin-right: 12px;
}

/* the actual dropdown menus are body mounted */
.el-dropdown-menu.lq-workspace-selector {
  overflow: auto;                   /* make workspace selector scroll */
  max-height: calc(100% - 68px);    /* use screen height to show as much workspaces as possible */
}

.el-dropdown-menu.lq-workspace-selector .el-dropdown-menu__item {
  line-height: unset;
}

.el-dropdown-menu.lq-workspace-selector .el-dropdown-menu__item > div {
  padding-top: 6px;
  padding-bottom: 6px;
}
</style>
