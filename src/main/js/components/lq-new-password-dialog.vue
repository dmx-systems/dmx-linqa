<template>
  <el-dialog custom-class="lq-new-password-dialog" :visible="visible" width="350px" @close="callLoginRoute">
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

  created () {
    this.$store.dispatch('checkToken', this.key).then(response => {
      if (response.result === 'SUCCESS') {
        this.visible = true
      } else {
        // TODO: differentiate by error code
        this.$alert('The token contained in the link is not valid (anymore)', {    // TODO: wording
          title: response.result,
          type: 'error',
          showClose: false
        }).then(this.callLoginRoute)
      }
    })
  },

  data () {
    return {
      visible: false,
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

    callLoginRoute () {
      this.$store.dispatch('callLoginRoute')
    },

    changePassword () {
      this.$store.dispatch('changePassword', {key: this.key, password: this.password}).then(this.callLoginRoute)
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
