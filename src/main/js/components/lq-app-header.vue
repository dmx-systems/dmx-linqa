<template>
  <div :class="['lq-app-header', {'small-screen': isSmallScreen}]">
    <img class="logo" :src="logo(true)">

    <div style="display: flex;">
    <lq-canvas-search></lq-canvas-search>

    <div class="workspace">
      <lq-string v-if="isAdminRoute" class="name" key="admin">label.admin</lq-string>
      <template v-else>
          <div class="flex flex-wrap items-center">

    <el-dropdown split-button trigger="hover" type="primary" @click="setWorkspace" @command="setWorkspace">
      {{workspaceName}}
      <template #dropdown>
        <el-dropdown-menu>
                     <el-dropdown-item v-for="workspace in workspaces" :command="workspace.id" :key="workspace.id">
                <div>{{getWorkspaceName(workspace)}}</div>
              </el-dropdown-item>
              <el-dropdown-item v-if="isLinqaAdmin && linqaAdminWs" :command="linqaAdminWs.id"
                  :divided="workspacesExist">
                <div>{{getWorkspaceName(linqaAdminWs)}}</div>
              </el-dropdown-item>
        </el-dropdown-menu>
      </template>
    </el-dropdown>
  </div>

        <!-- <span class="label"><lq-string>label.shared_workspace</lq-string>: </span> -->
<!--         <el-dropdown trigger="hover"  split-button @command="setWorkspace">
          <el-button type="primary" link :title="selectTooltip">
            <span class="name">{{workspaceName}}</span>

          </el-button>
          <template #dropdown>
            <el-dropdown-menu class="lq-workspace-selector">
              <el-dropdown-item v-for="workspace in workspaces" :command="workspace.id" :key="workspace.id">
                <div>{{getWorkspaceName(workspace)}}</div>
              </el-dropdown-item>
              <el-dropdown-item v-if="isLinqaAdmin && linqaAdminWs" :command="linqaAdminWs.id"
                  :divided="workspacesExist">
                <div>{{getWorkspaceName(linqaAdminWs)}}</div>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown> -->
      </template>
    </div>
</div>

    <div style="display: flex;">
    <lq-language-switch></lq-language-switch>

    <el-button class="admin-button fa fa-cog" v-if="isLinqaAdmin" type="primary" link :title="adminTooltip"
      @click="admin">
    </el-button>
    <el-dropdown class="info-menu" v-if="isBigScreen" trigger="click" @command="openInfo">
      <el-button class="admin-button fa fa-info-circle" type="primary" link>
        <!-- <el-icon class="el-icon--right"><arrow-down-bold></arrow-down-bold></el-icon> -->
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
    <lq-account-menu></lq-account-menu>
    <lq-help-dialog :visible="helpVisible" :firstLogin="firstLogin" @close="closeHelp"></lq-help-dialog>
    <lq-about-dialog></lq-about-dialog>
    <!-- Workspace selector -->
    </div>

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
    'lq-account-menu': require('./lq-account-menu').default,
    'lq-help-dialog': require('./lq-help-dialog').default,
    'lq-canvas-search': require('./lq-canvas-search').default
  }
}
</script>

<style>
.lq-app-header {
  display: flex;
  align-items: top;
  flex: none;
  justify-content: space-between;
  flex-flow: row wrap;
  padding: 0px 10px;
  z-index: 3;
  box-shadow: 1px 3px 6px -3px rgba(219,219,219,0.75);
  -webkit-box-shadow: 1px 3px 6px -3px rgba(219,219,219,0.75);
  -moz-box-shadow: 1px 3px 6px -3px rgba(219,219,219,0.75);
  /*  background-color: var(--header-color);*/
}

.lq-app-header img.logo {
  height: 70px;
/*  margin-left: -10px !important;*/
}

.lq-app-header .workspace {
  flex-grow: 1;
/* overflow: hidden;     clip workspace selector in favor of other header buttons */
  text-align: left;
  max-width: 400px;
  align-items: center;
  display:flex;
  justify-content: space-around;
}

.lq-app-header.small-screen .workspace .selector-label {
  display: none;
}

.lq-app-header .workspace .name {
  font-weight: bold;
/*  font-style: italic;*/
}

.lq-app-header .admin-button {
  font-size:22px;
  margin: 0 10px 0 0;
}

.lq-app-header .info-menu,
.lq-app-header .lq-language-switch {
  margin-right: 12px;
}
</style>
