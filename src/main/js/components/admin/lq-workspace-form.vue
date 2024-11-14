<template>
  <div class="lq-workspace-form" :key="formMode">
    <div class="heading"><lq-string>{{heading}}</lq-string></div>
    <div class="field">
      <div class="field-label"><lq-string>label.workspace_name</lq-string> ({{$store.state.lang1}})</div>
      <el-input v-model="lang1.value"></el-input>
    </div>
    <div class="field">
      <div class="field-label"><lq-string>label.workspace_name</lq-string> ({{$store.state.lang2}})</div>
      <el-input v-model="lang2.value"></el-input>
    </div>
    <el-button class="submit-button" type="primary" size="medium" @click="submit">
      <lq-string>action.submit</lq-string>
    </el-button>
    <el-button size="medium" @click="cancel">
      <lq-string>action.cancel</lq-string>
    </el-button>
  </div>
</template>

<script>
import dmx from 'dmx-api'

export default {

  mixins: [
    require('./mixins/cancel').default
  ],

  created () {
    this.initModel()
  },

  data () {
    return {
      model: undefined      // Workspace form model (Object)
    }
  },

  computed: {

    lang1 () {
      return this.model.children['dmx.workspaces.workspace_name#linqa.lang1']
    },

    lang2 () {
      return this.model.children['dmx.workspaces.workspace_name#linqa.lang2']
    },

    heading () {
      return this.isUpdate ? 'label.edit_workspace' : 'label.new_workspace'
    },

    isUpdate () {
      return this.formMode === 'update'
    },

    formMode () {
      return this.$store.state.admin.formMode
    },

    selectedWorkspace () {
      return this.$store.state.admin.selectedWorkspace
    }
  },

  watch: {
    selectedWorkspace () {
      this.initModel()
    }
  },

  methods: {

    initModel () {
      if (this.isUpdate) {
        this.model = dmx.typeCache.getTopicType('dmx.workspaces.workspace').newFormModel(this.selectedWorkspace.clone())
      } else {
        this.model = dmx.typeCache.getTopicType('dmx.workspaces.workspace').newFormModel()
      }
    },

    submit () {
      if (this.formMode === 'create') {
        this.$store.dispatch('admin/createLinqaWorkspace', {
          nameLang1: this.lang1.value,
          nameLang2: this.lang2.value
        })
      } else if (this.formMode === 'update') {
        this.$store.dispatch('admin/updateWorkspace', this.model)
      }
    }
  }
}
</script>
