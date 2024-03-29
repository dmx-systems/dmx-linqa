<template>
  <el-collapse-item :class="['lq-user-item', {'lq-selected': selected}]" :name="user.value">
    <div class="user" slot="title">
      <div class="name"><span class="fa fa-fw fa-user"></span> {{displayName}} ({{user.value}})</div>
      <div class="active"><span :class="['fa', active ? 'fa-check' : 'fa-minus']"></span></div>
      <el-dropdown size="medium" trigger="click" @command="handle" @click.native.stop>
        <el-button type="text" class="fa fa-fw fa-ellipsis-v"></el-button>
        <el-dropdown-menu slot="dropdown">
          <el-dropdown-item command="edit">
            <i class="fa fa-fw fa-pencil"></i><lq-string>action.edit_user</lq-string>
          </el-dropdown-item>
          <el-dropdown-item command="delete">
            <i class="fa fa-fw fa-trash"></i><lq-string>action.delete_user</lq-string>
          </el-dropdown-item>
          <el-dropdown-item command="editAffiliations" divided>
            <i class="fa fa-fw fa-list"></i><lq-string>action.edit_affiliations</lq-string>
          </el-dropdown-item>
        </el-dropdown-menu>
      </el-dropdown>
    </div>
    <div v-for="workspace in memberships">
      <span class="fa fa-fw fa-list"></span>
      {{getWorkspaceName(workspace)}}
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
    user: {      // plain Username topic
      type: Object,
      required: true
    }
  },

  computed: {

    selectedUser () {
      return this.$store.state.admin.selectedUser
    },

    selected () {
      return this.selectedUser?.id === this.user.id
    },

    active () {
      return this.user.children['linqa.user_active']?.value
    },

    displayName () {
      return lq.getDisplayName(this.user.value)
    },

    memberships () {
      return this.$store.getters.sortedMemberships[this.user.value]
    }
  },

  methods: {

    handle (command) {
      this[command]()
    },

    edit () {
      this.$store.dispatch('admin/showUserForm', this.user)
    },

    delete () {
      this.$store.dispatch('admin/setSelectedUser', this.user)
      this.$store.dispatch('admin/deleteUser', this.user)
    },

    editAffiliations () {
      this.$store.dispatch('admin/setSelectedUser', this.user)
      this.$store.dispatch('admin/setSecondaryPanel', 'lq-user-memberships')
    }
  }
}
</script>

<style>
.lq-user-item .user {
  display: flex;
  width: 92%;
}

.lq-user-item .user .name {
  flex-grow: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-right: 30px;
}

.lq-user-item .user .active {
  margin-right: 60px;
}
</style>
