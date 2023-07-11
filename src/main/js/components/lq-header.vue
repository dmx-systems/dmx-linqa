<template>
  <div class="lq-header">
    <img class="logo" :src="logo">
    <!-- Workspace selector -->
    <div class="workspace">
      <lq-string v-if="isAdminRoute" class="name" key="admin">label.admin</lq-string>
      <template v-else>
        <lq-string>label.shared_workspace</lq-string>:
        <el-dropdown size="medium" trigger="click" @command="setWorkspace">
          <el-button type="text" :title="selectTooltip">
            <span class="name">{{workspaceName}}</span><span class="el-icon-arrow-down el-icon--right"></span>
          </el-button>
          <el-dropdown-menu class="lq-workspace-selector" slot="dropdown">
            <el-dropdown-item v-for="workspace in workspaces" :command="workspace.id" :key="workspace.id">
              {{getWorkspaceName(workspace)}}
            </el-dropdown-item>
            <el-dropdown-item v-if="isTeam && teamWorkspace" :command="teamWorkspace.id" :divided="workspacesExist">
              {{getWorkspaceName(teamWorkspace)}}
            </el-dropdown-item>
          </el-dropdown-menu>
        </el-dropdown>
      </template>
    </div>
    <!-- Admin button -->
    <el-button class="admin-button fa fa-wrench" v-if="isTeam" type="text" :title="adminTooltip" @click="admin">
    </el-button>
    <lq-language-switch></lq-language-switch>
    <lq-user-menu></lq-user-menu>
  </div>
</template>

<script>
import zw from '../lq-globals'

export default {

  mixins: [
    require('./mixins/logo').default,
    require('./mixins/workspace-name').default
  ],

  computed: {

    workspacesExist () {
      return this.workspaces.length > 0
    },

    teamWorkspace () {
      return this.$store.state.teamWorkspace
    },

    workspaces () {
      return this.$store.getters.sortedWorkspaces
    },

    isTeam () {
      return this.$store.state.isTeam
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
      return zw.getString('tooltip.select_workspace')
    },

    adminTooltip () {
      return zw.getString('tooltip.admin')
    }
  },

  methods: {

    setWorkspace (id) {
      this.$store.dispatch('callWorkspaceRoute', id)
    },

    admin () {
      this.$store.dispatch('callAdminRoute')
    }
  },

  components: {
    'lq-user-menu': require('./lq-user-menu').default
  }
}
</script>

<style>
.lq-header {
  display: flex;
  align-items: center;
  padding: 2px 10px;
  background-color: var(--header-color);
}

.lq-header img.logo {
  height: 44px;
  margin-right: 72px;
  filter: invert(90%);
}

.lq-header .workspace {
  flex-grow: 1;
  color: white;
}

.lq-header .workspace .name {
  font-weight: bold;
  font-style: italic;
}

.lq-header .admin-button {
  margin-right: 20px;
}

.lq-header .lq-user-menu {
  margin-left: 20px;
}

/* dropdown menus are body mounted */
body > .el-dropdown-menu.lq-workspace-selector {
  overflow: auto;
  max-height: calc(100% - 68px);
  white-space: nowrap;
}
</style>
