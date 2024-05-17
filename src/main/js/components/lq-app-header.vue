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
          <el-dropdown-menu class="lq-workspace-selector" slot="dropdown">
            <el-dropdown-item v-for="workspace in workspaces" :command="workspace.id" :key="workspace.id">
              <div>{{getWorkspaceName(workspace)}}</div>
            </el-dropdown-item>
            <el-dropdown-item v-if="isLinqaAdmin && linqaAdminWs" :command="linqaAdminWs.id" :divided="workspacesExist">
              <div>{{getWorkspaceName(linqaAdminWs)}}</div>
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </template>
    </div>
    <el-button class="admin-button fa fa-wrench" v-if="isLinqaAdmin" type="text" :title="adminTooltip" @click="admin">
    </el-button>
    <el-button class="help-button fa fa-question-circle" type="text" @click="openHelp"></el-button>
    <lq-language-switch></lq-language-switch>
    <lq-user-menu></lq-user-menu>
    <lq-help-dialog :visible="helpVisible" @close="closeHelp"></lq-help-dialog>
  </div>
</template>

<script>
import lq from '../lq-globals'

export default {

  mixins: [
    require('./mixins/logo').default,
    require('./mixins/workspace-name').default,
    require('./mixins/screen').default
  ],

  data () {
    return {
      helpVisible: false
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

    openHelp () {
      this.helpVisible = true
    },

    closeHelp () {
      this.helpVisible = false
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

.lq-app-header .admin-button,
.lq-app-header .help-button {
  margin-left: 0 !important;        /* Element UI sets 10px for consecutive buttons */
  margin-right: 20px;
}

.lq-app-header .lq-user-menu {
  margin-left: 12px;
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
