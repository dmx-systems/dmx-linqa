<template>
  <div :class="['lq-login', {'small-screen': isSmallScreen}]">
    <lq-language-switch></lq-language-switch>

    <div class="lq-form-container">
      <div class="login-form">
        <img class="logo" :src="logo()">
        <div class="field">
          <div class="field-label"><lq-string>label.email_address</lq-string></div>
          <el-input size="large" v-model="credentials.username" ref="username" @keyup.enter="advance"></el-input>
        </div>
        <div class="field">
          <div class="field-label"><lq-string>label.password</lq-string></div>
          <el-input size="large" v-model="credentials.password" ref="password" @keyup.enter="login" type="password"></el-input>
        </div>
        <div class="password-reset">
          <lq-string class="label">label.forgot_password</lq-string>
          <el-button type="primary" link @click="openDialog"><lq-string>action.reset_password</lq-string></el-button>
        </div>
        <el-button size="large" class="login-button" type="primary" @click="login">Login</el-button>
        <span class="message">{{message}}</span> 
      </div>
      <div class="footer">
        <el-button type="primary" link @click="openAbout"><lq-string>label.about</lq-string></el-button>
        <el-button type="primary" link @click="openImprint"><lq-string>label.imprint</lq-string></el-button>
        <el-button type="primary" link @click="openPrivacyPolicy"><lq-string>label.privacy_policy</lq-string></el-button>
      </div>
 
      <router-view></router-view>
      <lq-about-dialog></lq-about-dialog> 
    </div>

    <div class="lq-info-container">
      <div class="welcome">
          <lq-string>label.welcome</lq-string>
        <div class="slogan">
          <lq-string html>label.slogan</lq-string>
        </div>
      </div>
    </div>
   
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
/*  flex-direction: column;*/
  height: 100%;
  width: 100%;
    background-color: white;

}

.lq-login.small-screen {
/*  padding: 40px 0 18px 60px;*/
}

.lq-login .lq-language-switch {
  position: absolute;
  top: 16px;
  right: 16px;
  z-index:3;
}

.lq-login .lq-language-switch span {
}

.lq-login img.logo {
  height: 100px;
}

.lq-login .logo {
  margin-top: 15vh;
  margin-bottom: 30px;
  /*  align-self: flex-start;
  width: fit-content;*/
}

.lq-login.small-screen img.logo {
/*  height: 64px;*/
}

.lq-login .login-form {
  align-content: center;
  margin: auto;
  /*  margin-bottom: 20px;
  padding-left: 15px; */
}

.lq-login .footer {
  margin-bottom: 20px;
  margin-top: 20px;
}

.lq-login.small-screen .login-form {
  margin-top: 40px;
}

.lq-login .login-form .el-input {
  width: 80vw;
  max-width: 280px;
}

.lq-login .welcome {
/*  color: var(--primary-color);*/
  color: #fff481;
  font-size: 16px;
  font-weight: lighter;
  text-transform: uppercase;
  z-index: 3;
  align-self: flex-end;
  margin: 5vw;
}

.lq-login .login {
  color: #fff481;
  font-size: 36px;
  font-weight: lighter;
  margin-top: 10px;
  margin-bottom: 28px;
}

.lq-login .slogan {
  color: white;
  font-size: 18px;
  font-weight: lighter;
  margin-top: 20px;
  z-index: 3;
  text-transform: initial;
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
  font-size: var(--secondary-font-size) !important;
  margin-left: 2px;
}

.lq-login .message {
  color: var(--primary-color);
  font-size: 16px;
  margin-left: 24px;
}

.lq-login .login-button {
  margin-top: 26px;
}

.lq-login .footer .el-button {
  font-size: var(--secondary-font-size);
}

.lq-login .footer .el-button + .el-button {
}

.lq-form-container {
  background-color:white; 
  height: 100%; 
  min-width: 45vw;
  align-content: space-between;
  justify-content: center;
  display: inline-grid;
  margin-left:20px;
}

@media screen and (max-width: 720px) {
  .lq-login {
    flex-direction: column;
    overflow-y: auto;
  }

  .lq-info-container {
    min-height: 320px;
  }

  .lq-form-container {
    min-height: 640px;
  }

  .lq-login .logo {
    margin-top: 10vh;
  }
}

.lq-info-container {
  height: 100%;
  align-content: flex-end;
  background-size: cover;
  background-image: url("../../resources-build/colaboracion-lq.jpg");
  background-repeat: no-repeat; 
  width: 100%;
  display: inline-grid;
}

.lq-login .password-reset .el-button {
  color: #c05c51;
}

@media screen and (max-width: 720px) {
  .lq-login {
    flex-direction: column;
    overflow-y: auto;
  }

  .lq-info-container {
    min-height: 320px;
  }

  .lq-form-container {
    min-height: 540px;
  }

  .lq-login .logo {
    margin-top: 10vh;
  }
}

</style>
