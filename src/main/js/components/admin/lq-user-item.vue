<template>
  <el-collapse-item :class="['lq-user-item', {'lq-selected': selected}]" :name="user.value" :data-id="user.id">
    <template #title>
      <div class="user">
        <div class="name"><span class="fa fa-fw fa-user"></span> {{displayName}} ({{user.value}})</div>
        <div class="active"><span :class="['fa', active ? 'fa-check' : 'fa-minus']"></span></div>
        <el-dropdown trigger="click" @command="handle">
          <el-button type="primary" link class="fa fa-fw fa-ellipsis-v" @click.stop></el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="edit">
                <i class="fa fa-fw fa-pencil"></i><lq-string>action.edit_user</lq-string>
              </el-dropdown-item>
              <el-dropdown-item command="delete">
                <i class="fa fa-fw fa-trash"></i><lq-string>action.delete_user</lq-string>
              </el-dropdown-item>
              <el-dropdown-item command="editMemberships" divided>
                <i class="fa fa-fw fa-list"></i><lq-string>action.edit_affiliations</lq-string>
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </template>
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
      this.$store.dispatch('admin/editUser', this.user)
    },

    delete () {
      this.$store.dispatch('admin/deleteUser', this.user)
    },

    editMemberships () {
      this.$store.dispatch('admin/editUserMemberships', this.user)
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
