<template>
  <div :class="['lq-login', {'small-screen': isSmallScreen}]">
    <lq-language-switch></lq-language-switch>
    <div style="display:flex">
    <div style="background-color:whitesmoke; height:100%; padding:50px 20px;">
    <img class="logo" :src="logo()">
    <div class="login-form">
      <div class="welcome">
        <lq-string>label.welcome</lq-string>
      </div>
      <div class="login">
        <lq-string>label.login</lq-string>
      </div>
      <div class="field">
        <div class="field-label"><lq-string>label.email_address</lq-string></div>
        <el-input v-model="credentials.username" ref="username" @keyup.enter="advance"></el-input>
      </div>
      <div class="field">
        <div class="field-label"><lq-string>label.password</lq-string></div>
        <el-input v-model="credentials.password" ref="password" @keyup.enter="login" type="password"></el-input>
      </div>
      <div class="password-reset">
        <lq-string class="label">label.forgot_password</lq-string>
        <el-button type="primary" link @click="openDialog"><lq-string>action.reset_password</lq-string></el-button>
      </div>
      <el-button class="login-button" type="primary" @click="login">Login</el-button>
      <span class="message">{{message}}</span>
    </div>
    <div class="footer">
      <el-button type="primary" link @click="openAbout"><lq-string>label.about</lq-string></el-button>
      <el-button type="primary" link @click="openImprint"><lq-string>label.imprint</lq-string></el-button>
      <el-button type="primary" link @click="openPrivacyPolicy"><lq-string>label.privacy_policy</lq-string></el-button>
    </div>
    </div>
    <div style="background-color:#254080; width: 60%; padding:0px;"></div>
   
    <router-view></router-view>
    <lq-about-dialog></lq-about-dialog> </div>
  </div>
</template>

<script>
export default {

  mixins: [
    require('./mixins/logo').default
  ],

  mounted () {
    this.$refs.username.focus()
  },

  data () {
    return {
      credentials: {
        username: '',
        password: ''
      }
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

    // Password Reset

    openDialog () {
      this.$store.dispatch('callPasswordResetRoute')
    },

    // Legal

    openAbout () {
      this.$store.dispatch('openAboutDialog')
    },

    openImprint () {
      this.$store.dispatch('callRoute', 'imprint')
    },

    openPrivacyPolicy () {
      this.$store.dispatch('callRoute', 'privacy_policy')
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
  background-color: #254080; 
/*  padding: 60px 0 18px 160px;*/
}

.lq-login.small-screen {
  padding: 40px 0 18px 60px;
}

.lq-login .lq-language-switch {
  position: absolute;
  top: 16px;
  right: 16px;
}

.lq-login img.logo {
  align-self: flex-start;
  height: 110px;
}

.lq-login.small-screen img.logo {
  height: 64px;
}

.lq-login .login-form {
  margin-top: 50px;
  margin-bottom: auto;
  padding-left: 15px;
}

.lq-login.small-screen .login-form {
  margin-top: 40px;
}

.lq-login .login-form .el-input {
  width: 80vw;
  max-width: 280px;
}

.lq-login .welcome {
  color: var(--primary-color);
  font-size: 20px;
}

.lq-login .login {
  color: var(--primary-color);
  font-size: 36px;
  font-weight: lighter;
  margin-top: 10px;
  margin-bottom: 28px;
}

.lq-login.small-screen .login {
  font-size: 32px;
  margin-top: 6px;
  margin-bottom: 16px;
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

.lq-login .login-button {
  font-size: 16px;
  margin-top: 26px;
  margin-bottom: 36px;
}

.lq-login .footer .el-button {
  font-size: var(--secondary-font-size);
}

.lq-login .footer .el-button + .el-button {
  margin-left: 20px;
}
</style>
