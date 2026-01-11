<template>
  <div class="lq-user-list">
    <div class="heading"><lq-string>label.admin_users</lq-string></div>
    <div class="active"><lq-string>label.active</lq-string></div>
    <el-scrollbar :always="true">
      <el-collapse v-model="expandedUsernames">
        <lq-user-item v-for="user in users" :user="user" :key="user.id"></lq-user-item>
      </el-collapse>
    </el-scrollbar>
    <el-button class="add-button" @click="newUser">
      <span class="fa fa-fw fa-plus"></span>
      <lq-string>action.add_user</lq-string>
    </el-button>
  </div>
</template>

<script>
export default {

  created () {
    this.$store.dispatch('fetchAllUsers')
  },

  computed: {

    users () {
      return this.$store.state.users
    },

    expandedUsernames: {
      get () {
        return this.$store.state.admin.expandedUsernames
      },
      set (usernames) {
        this.$store.dispatch('admin/setExpandedUsernames', usernames)
      }
    }
  },

  methods: {
    newUser () {
      this.$store.dispatch('admin/newUser')
    }
  },

  components: {
    'lq-user-item': require('./lq-user-item').default
  }
}
</script>

<style>
.lq-user-list > .active {
  margin-left: calc(92% - 114px);
  margin-bottom: 6px;
}

.lq-user-list .el-scrollbar {
  height: unset;        /* Element Plus default of 100% attaches add-button to window bottom. */
                        /* We want add-button always attached to user list. */
}

.lq-user-list .el-collapse {
  margin-right: 8px;    /* make room for el-scrollbar */
}
</style>
