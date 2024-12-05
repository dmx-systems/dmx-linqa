<template>
  <el-collapse-item :class="['lq-workspace-item', {'lq-selected': selected}]" :name="workspace.id"
      :data-id="workspace.id">
    <div class="workspace" slot="title">
      <div class="name"><span class="fa fa-fw fa-list"></span> {{workspaceName}}</div>
      <div class="owner"><span class="fa fa-fw fa-user"></span> {{owner}}</div>
      <el-dropdown size="medium" trigger="click" @command="handle" @click.native.stop>
        <el-button type="text" class="fa fa-fw fa-ellipsis-v"></el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="show">
              <i class="fa fa-fw fa-eye"></i><lq-string>action.show_workspace</lq-string>
            </el-dropdown-item>
            <el-dropdown-item command="edit">
              <i class="fa fa-fw fa-pencil"></i><lq-string>action.edit_workspace</lq-string>
            </el-dropdown-item>
            <el-dropdown-item command="duplicate">
              <i class="fa fa-fw fa-files-o"></i><lq-string>action.duplicate_workspace</lq-string>
            </el-dropdown-item>
            <el-dropdown-item command="delete">
              <i class="fa fa-fw fa-trash"></i><lq-string>action.delete_workspace</lq-string>
            </el-dropdown-item>
            <el-dropdown-item command="editMemberships" divided>
              <i class="fa fa-fw fa-users"></i><lq-string>action.edit_memberships</lq-string>
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
    <div v-for="(username, i) in workspace.memberships">
      <span class="fa fa-fw fa-user"></span>
      {{displayNames[i]}} ({{username.value}})
    </div>
  </el-collapse-item>
</template>

<script>
import lq from '../../lq-globals'

export default {

  mixins: [
    require('../mixins/workspace-name').default
  ],

  props: {
    workspace: {
      type: Object,     // a plain Workspace topic
      required: true
    }
  },

  computed: {

    selectedWorkspace () {
      return this.$store.state.admin.selectedWorkspace
    },

    selected () {
      return this.selectedWorkspace?.id === this.workspace.id
    },

    displayNames () {
      return this.workspace.memberships.map(user => lq.getDisplayName(user.value))
    },

    owner () {
      return this.workspace.children['dmx.accesscontrol.owner'].value
    }
  },

  methods: {

    handle (command) {
      this[command]()
    },

    show () {
      this.$store.dispatch('callWorkspaceRoute', this.workspace.id)
    },

    edit () {
      this.$store.dispatch('admin/editWorkspace', this.workspace)
    },

    duplicate () {
      this.$store.dispatch('admin/duplicateWorkspace', this.workspace)
    },

    delete () {
      this.$store.dispatch('admin/deleteWorkspace', this.workspace)
    },

    editMemberships () {
      this.$store.dispatch('admin/editWorkspaceMemberships', this.workspace)
    }
  }
}
</script>

<style>
.lq-workspace-item .workspace {
  display: flex;
  width: 92%;
}

.lq-workspace-item .workspace .name {
  flex-basis: 64%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 30px;
}

.lq-workspace-item .workspace .owner {
  flex-basis: 34%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 30px;
}
</style>
