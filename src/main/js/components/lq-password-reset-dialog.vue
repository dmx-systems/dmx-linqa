<template>
  <el-dialog custom-class="lq-password-reset-dialog" :visible="true" width="350px" @close="closeDialog">
    <lq-string slot="title">label.reset_password</lq-string>
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

  data () {
    return {
      emailAddress: ''
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
