<template>
  <div class="lq-user-list">
    <div class="heading"><lq-string>label.admin_users</lq-string></div>
    <div class="active"><lq-string>label.active</lq-string></div>
    <div class="scroll-container">
      <el-collapse v-model="expandedUsernames">
        <lq-user-item v-for="user in users" :user="user" :key="user.id"></lq-user-item>
      </el-collapse>
    </div>
    <el-button class="add-button" size="medium" icon="el-icon-plus" @click="addUser">
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
    addUser () {
      this.$store.dispatch('admin/showUserForm')
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
</style>
