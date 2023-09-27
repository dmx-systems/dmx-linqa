<template>
  <el-dialog custom-class="lq-new-password-dialog" :visible="true" width="350px" @close="closeDialog">
    <lq-string slot="title">label.reset_password</lq-string>
    <div class="field">
      <div class="field-label"><lq-string :value="emailAddress">label.new_password</lq-string></div>
      <el-input v-model="password" type="password"></el-input>
    </div>
    <el-button class="change-button" type="primary" @click="changePassword">
      <lq-string>action.submit</lq-string>
    </el-button>
  </el-dialog>
</template>

<script>
export default {

  data () {
    return {
      password: ''
    }
  },

  computed: {

    emailAddress () {
      return this.router.currentRoute.params.emailAddress
    },

    key () {
      return this.router.currentRoute.params.key
    },

    router () {
      return this.$store.state.routerModule.router
    }
  },

  methods: {

    closeDialog () {
      this.$store.dispatch('callLoginRoute')
    },

    changePassword () {
      this.$store.dispatch('changePassword', {key: this.key, password: this.password}).then(this.closeDialog)
    }
  }
}
</script>

<style>
.lq-new-password-dialog .change-button {
  font-size: 16px;
  margin-top: 26px;
}
</style>
