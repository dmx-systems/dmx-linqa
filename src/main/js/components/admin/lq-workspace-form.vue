<template>
  <div class="lq-workspace-form">
    <div class="heading"><lq-string>{{heading}}</lq-string></div>
    <div class="field">
      <div class="field-label"><lq-string>label.workspace_name</lq-string> (lang1)</div>
      <el-input v-model="lang1.value"></el-input>
    </div>
    <div class="field">
      <div class="field-label"><lq-string>label.workspace_name</lq-string> (lang2)</div>
      <el-input v-model="lang2.value"></el-input>
    </div>
    <el-button class="submit-button" type="primary" size="medium" @click="submit">
      <lq-string>action.submit</lq-string>
    </el-button>
    <el-button size="medium" @click="clearSecondaryPanel">
      <lq-string>action.cancel</lq-string>
    </el-button>
  </div>
</template>

<script>
export default {

  mixins: [
    require('./mixins/admin-util').default
  ],

  computed: {

    lang1 () {
      return this.editBuffer.children['dmx.workspaces.workspace_name#linqa.lang1']
    },

    lang2 () {
      return this.editBuffer.children['dmx.workspaces.workspace_name#linqa.lang2']
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

    editBuffer () {
      return this.$store.state.admin.editBuffer
    }
  },

  methods: {
    submit () {
      let p
      this.$emit('loading')
      if (this.formMode === 'create') {
        p = this.$store.dispatch('admin/createZWWorkspace', {
          nameLang1: this.lang1.value,
          nameLang2: this.lang2.value
        })
      } else if (this.formMode === 'update') {
        p = this.$store.dispatch('admin/updateWorkspace', this.editBuffer)
      }
      p.then(() => {
        this.$emit('complete')
        this.clearSecondaryPanel()
      })
    }
  }
}
</script>
