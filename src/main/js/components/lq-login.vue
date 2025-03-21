<template>
  <div :class="['lq-login', {'small-screen': isSmallScreen}]">
    <div class="lq-form-container">
      <lq-language-switch></lq-language-switch>
      <img class="logo" :src="logo()">
      <div class="login-form">
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
      </div>
      <div class="slogan">
        <lq-string html>label.slogan</lq-string>
      </div>
      <div class="lq-container-back"></div>

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
  box-sizing: border-box;
  background-color:rgb(9, 39, 109);
  background: linear-gradient(90deg, rgba(25,45,96,1) 43%, rgba(37,64,128,1) 74%, rgba(40,78,166,1) 100%); 
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
  color:white;
}

.lq-login img.logo {
  height: 110px;
}

.lq-login .logo {
  margin-top:30px;
  align-self: flex-start;
  width: fit-content;
}

.lq-login.small-screen img.logo {
/*  height: 64px;*/
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
/*  color: var(--primary-color);*/
  color: #fff481;
  font-size: 16px;
  font-weight: lighter;
  text-transform: uppercase;
  z-index: 3;
  padding-top:20px;
  position: absolute;
  bottom:160px;
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
  font-size: 22px;
  font-weight: lighter;
  margin-top: 20px;
  z-index: 3;
  position: absolute;
  bottom:30px;
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
  margin-left: 15px;
}

.lq-login .footer .el-button + .el-button {
  margin-left: 40px;
}

.lq-form-container {
  background-color:white; 
  height: 100%; 
  min-width: 45vw;
  align-content: space-around;
  justify-content: center;
  display: inline-grid;
}

@media screen and (max-width: 720px) {
  .lq-login {
    flex-direction: column;
  }

}

.lq-info-container {
  height: 100%;
  align-content: flex-end;
  justify-content: center; 
}

.lq-info-container > * {
   padding: 0 60px 50px 50px;
}

.lq-container-back {
  height: 100%;
  z-index:0;
  width:100vh;
  position:relative;
  top:0;
  background-position: 50% 70%;
  background-size: 160%;
  background-image: url("../../resources-build/laptops8.jpg");
  background-repeat: no-repeat;  
  filter: grayscale(50%) sepia(100%) brightness(45%) hue-rotate(180deg) saturate(163%) opacity(60%) contrast(147%);
-webkit-filter: grayscale(50%) sepia(100%) brightness(45%) hue-rotate(180deg) saturate(163%) opacity(60%) contrast(147%);
-moz-filter: grayscale(50%) sepia(100%) brightness(45%) hue-rotate(180deg) saturate(163%) opacity(60%) contrast(147%);
}

.lq-login .password-reset .el-button {
  color: #c05c51;
}

</style>
