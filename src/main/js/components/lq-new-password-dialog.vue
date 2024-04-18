<template>
  <el-dialog custom-class="lq-new-password-dialog" :visible="visible" width="350px" @close="callLoginRoute">
    <lq-string slot="title">label.reset_password</lq-string>
    <div class="field">
      <div class="field-label"><lq-string :value="emailAddress">label.new_password</lq-string></div>
      <el-input v-model="password" type="password"></el-input>
    </div>
    <transition>
      <lq-string class="requirements field label" v-if="showRequirements" :html="true">
        label.password_requirements
      </lq-string>
    </transition>
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
      password: '',
      showRequirements: false
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

    changePassword () {
      this.$store.dispatch('changePassword', {
        key: this.key,
        password: this.password
      }).then(result => {
        if (result === 'PASSWORD_COMPLEXITY_INSUFFICIENT') {
          this.showRequirements = true
        } else {
          this.callLoginRoute()
        }
      })
    },

    callLoginRoute () {
      this.$store.dispatch('callLoginRoute')
    }
  }
}
</script>

<style>
.lq-new-password-dialog .requirements {
  word-break: normal;     /* el-dialog__body default is "break-all" */
  overflow: hidden;       /* reveal text while transition */
}

.lq-new-password-dialog .requirements ul {
  margin-top: 4px;        /* Browser style is 13px */
  margin-bottom: 0;       /* Browser style is 13px */
  padding-left: 18px;     /* Browser style is 40px */
}

.lq-new-password-dialog .requirements.v-enter {
  height: 0;
  opacity: 0;
}

.lq-new-password-dialog .requirements.v-enter-active {
  transition: height .5s, opacity .5s;
}

.lq-new-password-dialog .requirements.v-enter-to {
  height: 184px;
}

.lq-new-password-dialog .change-button {
  font-size: 16px;
  margin-top: 26px;
}
</style>
