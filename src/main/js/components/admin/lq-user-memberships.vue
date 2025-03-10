<template>
  <div class="lq-user-memberships">
    <div class="heading"><lq-string>label.edit_affiliations</lq-string></div>
    <el-scrollbar :always="true">
      <table>
        <thead>
          <tr>
            <th><lq-string>label.workspace</lq-string></th>
            <th><lq-string>label.member</lq-string></th>
            <th><lq-string>label.editor</lq-string></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="ws in workspaces">
            <td>{{getWorkspaceName(ws)}}</td>
            <td><el-checkbox v-model="model1[ws.id]"></el-checkbox></td>
            <td><el-checkbox v-model="model2[ws.id]" :disabled="!model1[ws.id]"></el-checkbox></td>
          </tr>
        </tbody>
      </table>
    </el-scrollbar>
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
    require('./mixins/cancel').default,
    require('../mixins/workspace-name').default
  ],

  created () {
    this.initModel()
  },

  data () {
    return {
      model1: {},     // checkbox model (column 1): workspace ID -> flag (true=member)
      model2: {}      // checkbox model (column 2): workspace ID -> flag (true=editor)
    }
  },

  computed: {

    workspaces () {
      return this.$store.getters['admin/sortedWorkspaces']
    },

    selectedUser () {
      return this.$store.state.admin.selectedUser
    },

    memberships () {
      return this.selectedUser.memberships
    }
  },

  watch: {
    selectedUser () {
      this.initModel()
    }
  },

  methods: {

    initModel () {
      Promise.all([
        this.$store.dispatch('admin/fetchAllLinqaWorkspaces'),
        this.$store.dispatch('admin/fetchUserMemberships', this.selectedUser.value)
      ]).then(() => {
        this.model1 = this.workspaces.reduce((model, ws) => {model[ws.id] = this.isMember(ws); return model}, {})
        this.model2 = this.workspaces.reduce((model, ws) => {model[ws.id] = this.isEditor(ws); return model}, {})
      })
    },

    isMember (workspace) {
      return this.findWorkspace(workspace) !== undefined
    },

    isEditor (workspace) {
      return this.findWorkspace(workspace)?.assoc.children['linqa.editor']?.value
    },

    /**
     * Finds the given workspace among the selected user's workspaces.
     *
     * @return  The found workspace; its "assoc" property holds the respective Membership association.
     *          If the selected user is not a member of the given workspace undefined is returned.
     */
    findWorkspace (workspace) {
      return this.memberships?.find(ws => ws.id === workspace.id)
    },

    updateMemberships () {
      const addWorkspaceIds1    = this.workspaces.filter(ws =>  this.model1[ws.id]).map(ws => ws.id)
      const removeWorkspaceIds1 = this.workspaces.filter(ws => !this.model1[ws.id]).map(ws => ws.id)
      const addWorkspaceIds2    = this.workspaces.filter(ws =>  this.model2[ws.id]).map(ws => ws.id)
      const removeWorkspaceIds2 = this.workspaces.filter(ws => !this.model2[ws.id]).map(ws => ws.id)
      this.$store.dispatch('admin/updateUserMemberships', {
        addWorkspaceIds1, removeWorkspaceIds1, addWorkspaceIds2, removeWorkspaceIds2
      })
    }
  }
}
</script>

<style>
.lq-user-memberships {
  display: flex;
  flex-direction: column;
  padding-right: 0 !important;
}

.lq-user-memberships .el-scrollbar {
  height: unset;        /* Element Plus default of 100% attaches OK/Cancel-buttons to window bottom. */
                        /* We want OK/Cancel-buttons always be attached to workspace list. */
}

.lq-user-memberships table {
  width: 100%;
}

.lq-user-memberships table th {
  text-align: unset;        /* browser style is "center" */
  padding-bottom: 5px;
  padding-right: 20px;
}

.lq-user-memberships table td {
  word-break: break-all;    /* break long workspace names */
  padding-right: 20px;
}
</style>
