<template>
  <div class="lq-login">
    <lq-language-switch></lq-language-switch>
    <img :src="logo">
    <div class="login-form">
      <div class="welcome">
        <lq-string>label.welcome</lq-string>
      </div>
      <div class="login">
        <lq-string>label.login</lq-string>
      </div>
      <div class="field">
        <div class="field-label"><lq-string>label.email_address</lq-string></div>
        <el-input v-model="credentials.username" ref="username" @keyup.native.enter="advance"></el-input>
      </div>
      <div class="field">
        <div class="field-label"><lq-string>label.password</lq-string></div>
        <el-input v-model="credentials.password" ref="password" @keyup.native.enter="login" type="password"></el-input>
      </div>
      <div class="password-reset">
        <lq-string class="label">label.forgot_password</lq-string>
        <el-button type="text" @click="openDialog"><lq-string>action.reset_password</lq-string></el-button>
      </div>
      <el-button class="login-button" type="primary" @click="login">Login</el-button>
      <span class="message">{{message}}</span>
    </div>
    <div class="gap">
    </div>
    <div class="footer">
      <el-button type="text" @click="openImprint"><lq-string>label.imprint</lq-string></el-button>
      <el-button type="text" @click="openPrivacyPolicy"><lq-string>label.privacy_policy</lq-string></el-button>
    </div>
    <el-dialog :visible.sync="visible" width="350px">
      <lq-string slot="title">label.reset_password</lq-string>
      <div class="field">
        <div class="field-label"><lq-string>label.email_address</lq-string></div>
        <el-input v-model="emailAddress"></el-input>
      </div>
      <el-button class="reset-button" type="primary" @click="resetPassword">
        <lq-string>action.submit</lq-string>
      </el-button>
    </el-dialog>
  </div>
</template>

<script>
import dmx from 'dmx-api'
import zw from '../lq-globals'

export default {

  mixins: [
    require('./mixins/logo').default
  ],

  mounted () {
    this.$refs.username.focus()
  },

  data () {
    return {
      // Login dialog
      credentials: {
        username: '',
        password: ''
      },
      // Password-reset Dialog
      visible: false,
      emailAddress: ''
    }
  },

  computed: {

    message () {
      return this.$store.state.loginMessage
    },

    lang () {
      return this.$store.state.lang
    }
  },

  methods: {

    // Login

    login () {
      this.$store.dispatch('login', this.credentials).finally(() => {
        this.credentials.password = ''
      })
    },

    advance () {
      this.$refs.password.focus()
    },

    // Reset Password

    openDialog () {
      this.visible = true
    },

    closeDialog () {
      this.visible = false
    },

    resetPassword () {
      this.$store.dispatch('resetPassword', this.emailAddress).then(this.closeDialog)
    },

    // Legal

    openImprint () {
      this.$store.dispatch('callImprintRoute')
    },

    openPrivacyPolicy () {
      this.$store.dispatch('callPrivacyPolicyRoute')
    }
  }
}
</script>

<style>
.lq-login {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  background-color: black;
  background-image: url("../../resources-build/zw-snake.png");
  background-position: bottom right;
  background-repeat: no-repeat;
  padding: 60px 0 18px 160px;
}

.lq-login .lq-language-switch {
  position: absolute;
  top: 16px;
  right: 16px;
}

.lq-login img {
  align-self: flex-start;
  margin-left: -81px;
}

.lq-login .login-form .el-input {
  width: 280px;
}

.lq-login .welcome {
  color: var(--primary-color);
  font-size: 20px;
  margin-top: 42px;
}

.lq-login .login {
  color: var(--primary-color);
  font-size: 36px;
  font-weight: lighter;
  margin-top: 10px;
  margin-bottom: 28px;
}

.lq-login .password-reset {
  margin-top: 6px;
}

.lq-login .password-reset .el-button {
  font-size: var(--secondary-font-size);
  margin-left: 2px;
}

.lq-login .message {
  color: var(--primary-color);
  font-size: 16px;
  margin-left: 24px;
}

.lq-login .login-button,
.lq-login .reset-button {
  font-size: 16px;
  margin-top: 26px;
}

.lq-login .login-button {
  margin-bottom: 36px;
}

.lq-login .gap {
  flex-grow: 1;
}

.lq-login .footer .el-button {
  font-size: var(--secondary-font-size);
}

.lq-login .footer .el-button:nth-child(2) {
  margin-left: 15px;
}
</style>
