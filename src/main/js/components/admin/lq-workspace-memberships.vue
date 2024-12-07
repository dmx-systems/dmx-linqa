<template>
  <div class="lq-workspace-memberships">
    <div class="heading"><lq-string>label.edit_memberships</lq-string></div>
    <div class="scroll-container">
      <table>
        <thead>
          <tr>
            <th><lq-string>label.user</lq-string></th>
            <th><lq-string>label.member</lq-string></th>
            <th><lq-string>label.editor</lq-string></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(user, i) in users">
            <td>{{user.value}}</td>
            <td><el-checkbox v-model="model1[i]"></el-checkbox></td>
            <td><el-checkbox v-model="model2[i]" :disabled="!model1[i]"></el-checkbox></td>
          </tr>
        </tbody>
      </table>
    </div>
    <div>
      <el-button class="submit-button" type="primary" @click="updateMemberships">
        <lq-string>action.submit</lq-string>
      </el-button>
      <el-button @click="cancel">
        <lq-string>action.cancel</lq-string>
      </el-button>
    </div>
  </div>
</template>

<script>
export default {

  mixins: [
    require('./mixins/cancel').default
  ],

  created () {
    this.initModel()
  },

  data () {
    return {
      model1: [],      // column1 checkbox model: a flag for every user, true=member
      model2: []       // column2 checkbox model: a flag for every user, true=editor
    }
  },

  computed: {

    users () {
      return this.$store.state.users
    },

    selectedWorkspace () {
      return this.$store.state.admin.selectedWorkspace
    },

    memberships () {
      return this.selectedWorkspace.memberships
    }
  },

  watch: {
    selectedWorkspace () {
      this.initModel()
    }
  },

  methods: {

    initModel () {
      Promise.all([
        this.$store.dispatch('fetchAllUsers'),
        this.$store.dispatch('fetchWorkspaceMemberships', this.selectedWorkspace)
      ]).then(() => {
        this.model1 = this.users.map(user => this.isMember(user))
        this.model2 = this.users.map(user => this.isEditor(user))
      })
    },

    isMember (user) {
      return this.findUser(user) !== undefined
    },

    isEditor (user) {
      return this.findUser(user)?.assoc.children['linqa.editor']?.value
    },

    findUser (user) {
      return this.memberships?.find(u => u.id === user.id)
    },

    updateMemberships () {
      let i = 0; const addUserIds1    = this.users.filter(user =>  this.model1[i++]).map(user => user.id)
          i = 0; const removeUserIds1 = this.users.filter(user => !this.model1[i++]).map(user => user.id)
          i = 0; const addUserIds2    = this.users.filter(user =>  this.model2[i++]).map(user => user.id)
          i = 0; const removeUserIds2 = this.users.filter(user => !this.model2[i++]).map(user => user.id)
      this.$store.dispatch('admin/updateWorkspaceMemberships', {
        addUserIds1, removeUserIds1, addUserIds2, removeUserIds2
      })
    }
  }
}
</script>

<style>
.lq-workspace-memberships {
  display: flex;
  flex-direction: column;
  padding-right: 0 !important;
}

.lq-workspace-memberships .scroll-container {
  overflow: auto;
  flex-grow: 1;
}

.lq-workspace-memberships table {
  width: 100%;
}

.lq-workspace-memberships table th {
  text-align: unset;        /* browser style is "center" */
  padding-bottom: 5px;
  padding-right: 20px;
}

.lq-workspace-memberships table td {
  word-break: break-all;    /* break long usernames */
  padding-right: 20px;
}
</style>
