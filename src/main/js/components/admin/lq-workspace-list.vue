<template>
  <div class="lq-workspace-list">
    <div class="heading"><lq-string>label.admin_workspaces</lq-string></div>
    <div v-if="noWorkspaces" class="secondary"><lq-string>label.no_workspaces</lq-string></div>
    <template v-else>
      <div class="owner" key="owner"><lq-string>label.owner</lq-string></div>
      <div class="scroll-container">
        <el-collapse v-model="expandedIds">
          <lq-workspace-item v-for="workspace in workspaces" :workspace="workspace" :key="workspace.id">
          </lq-workspace-item>
        </el-collapse>
      </div>
    </template>
    <el-button class="add-button" size="medium" icon="el-icon-plus" @click="newWorkspace">
      <lq-string>action.add_workspace</lq-string>
    </el-button>
  </div>
</template>

<script>
export default {

  created () {
    this.$store.dispatch('admin/fetchAllLinqaWorkspaces')
  },

  computed: {

    workspaces () {
      return this.$store.getters['admin/sortedWorkspaces']
    },

    noWorkspaces () {
      return this.workspaces.length === 0
    },

    expandedIds: {
      get () {
        return this.$store.state.admin.expandedWorkspaceIds
      },
      set (ids) {
        this.$store.dispatch('admin/setExpandedWorkspaceIds', ids)
      }
    }
  },

  methods: {
    newWorkspace () {
      this.$store.dispatch('admin/newWorkspace')
    }
  },

  components: {
    'lq-workspace-item': require('./lq-workspace-item').default
  }
}
</script>

<style>
.lq-workspace-list > .owner {
  margin-left: calc(60% - 30px);
  margin-bottom: 6px;
}
</style>
