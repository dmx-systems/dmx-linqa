<template>
  <div class="lq-admin">
    <div class="nav-bar">
      <el-button :class="['fa', 'fa-list', {'lq-selected': area1}]" type="text" @click="goArea1"></el-button>
      <el-button :class="['fa', 'fa-users', {'lq-selected': area2}]" type="text" @click="goArea2"></el-button>
      <div class="gap"></div>
      <el-button class="close-button fa fa-times-circle-o" v-if="showClose" type="text" @click="close"></el-button>
    </div>
    <component class="primary-panel" :is="primaryPanel" v-loading="loading1"></component>
    <component class="secondary-panel" :is="secondaryPanel" v-loading="loading2"></component>
  </div>
</template>

<script>
export default {

  computed: {

    area1 () {
      return this.primaryPanel === 'lq-workspace-list'
    },

    area2 () {
      return this.primaryPanel === 'lq-user-list'
    },

    primaryPanel () {
      return this.$store.state.admin.primaryPanel
    },

    secondaryPanel () {
      return this.$store.state.admin.secondaryPanel
    },

    loading1 () {
      return this.$store.state.admin.loading1
    },

    loading2 () {
      return this.$store.state.admin.loading2
    },

    workspace () {
      return this.$store.state.workspace
    },

    showClose () {
      return this.workspace !== undefined
    }
  },

  methods: {

    goArea1 () {
      this.$store.dispatch('admin/setPrimaryPanel', 'lq-workspace-list')
    },

    goArea2 () {
      this.$store.dispatch('admin/setPrimaryPanel', 'lq-user-list')
    },

    close () {
      this.$store.dispatch('callWorkspaceRoute')
    }
  },

  components: {
    'lq-workspace-list': require('./lq-workspace-list').default,
    'lq-workspace-form': require('./lq-workspace-form').default,
    'lq-workspace-memberships': require('./lq-workspace-memberships').default,
    'lq-user-list': require('./lq-user-list').default,
    'lq-user-form': require('./lq-user-form').default,
    'lq-user-memberships': require('./lq-user-memberships').default
  }
}
</script>

<style>
.lq-admin {
  display: flex;
  flex-grow: 1;
  min-height: 0;
}

.lq-admin .nav-bar {
  display: flex;
  flex-direction: column;
  background-color: var(--background-color);
  padding: 20px 6px 6px 6px;
  flex-basis: 30px;
}

.lq-admin .nav-bar .el-button {
  font-size: 16px;
  line-height: 1.5;
}

.lq-admin .nav-bar .el-button.lq-selected {
  background-color: white;
}

.lq-admin .nav-bar .el-button + .el-button {
  margin-top: 10px;
  margin-left: 0;
}

.lq-admin .nav-bar .close-button {
  font-size: 20px;
}

.lq-admin .nav-bar .gap {
  flex-grow: 1;
}

.lq-admin .primary-panel {
  display: flex;
  flex-direction: column;
  flex-basis: 50%;
  min-width: 0;
  padding: 35px;
}

.lq-admin .primary-panel .heading {
  font-size: 20px;
  margin-bottom: 28px;
}

.lq-admin .primary-panel .scroll-container {
  overflow: auto;
}

.lq-admin .primary-panel .add-button {
  margin-top: 34px;
  align-self: flex-start;
}

.lq-admin .secondary-panel {
  flex-grow: 1;
  padding: 35px;
  background-color: var(--background-color);
}

.lq-admin .secondary-panel .heading {
  font-size: 20px;
  margin-bottom: 22px;
}

.lq-admin .secondary-panel .submit-button {
  margin-top: 26px;
}

/* override Element UI style */
.lq-admin .el-collapse-item__content {
  margin-left: 24px;
}
</style>
