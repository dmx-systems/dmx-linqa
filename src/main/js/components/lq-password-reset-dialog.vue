<template>
  <el-dialog class="lq-password-reset-dialog" :model-value="true" width="350px" @close="closeDialog">
    <template #header>
      <lq-string>label.reset_password</lq-string>
    </template>
    <div class="field">
      <div class="field-label"><lq-string>label.email_address</lq-string></div>
      <el-input v-model="emailAddress"></el-input>
    </div>
    <el-button class="reset-button" type="primary" @click="resetPassword">
      <lq-string>action.submit</lq-string>
    </el-button>
  </el-dialog>
</template>

<script>
export default {

  created () {
    this.emailAddress = this.email
  },

  data () {
    return {
      emailAddress: undefined
    }
  },

  computed: {

    email () {
      return this.router.currentRoute.query.email
    },

    router () {
      return this.$store.state.routerModule.router
    }
  },

  methods: {

    closeDialog () {
      this.$store.dispatch('callLoginRoute')
    },

    resetPassword () {
      this.$store.dispatch('resetPassword', this.emailAddress).then(this.closeDialog)
    }
  }
}
</script>

<style>
.lq-password-reset-dialog .reset-button {
  font-size: 16px;
  margin-top: 26px;
}
</style>
