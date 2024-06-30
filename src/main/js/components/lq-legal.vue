<template>
  <div :class="['lq-legal', routeName, {'small-screen': isSmallScreen}]">
    <lq-language-switch></lq-language-switch>
    <el-button class="home-button" type="text" @click="home">
      <img class="logo" :src="logo()">
    </el-button>
    <lq-string class="heading">{{heading}}</lq-string>
    <div class="scroll-container dmx-html-field">
      <div class="text" v-html="html"></div>
    </div>
  </div>
</template>

<script>
export default {

  mixins: [
    require('./mixins/logo').default
  ],

  created () {
    this.fetchLegalText()
  },

  data () {
    return {
      html: ''
    }
  },

  computed: {

    heading () {
      return 'label.' + this.routeName
    },

    routeName () {
      return this.router.currentRoute.name
    },

    router () {
      return this.$store.state.routerModule.router
    },

    lang () {
      return this.$store.state.lang
    }
  },

  watch: {
    lang ()      {this.fetchLegalText()},
    routeName () {this.fetchLegalText()}
  },

  methods: {

    fetchLegalText () {
      this.$store.dispatch('getConfigResource', {
        path: this.routeName + '.html', multilingual: true, lang: this.lang
      }).then(html => {
        this.html = html
      })
    },

    home () {
      this.$store.dispatch('callRootRoute')
    }
  }
}
</script>

<style>
.lq-legal {
  display: flex;
  flex-direction: column;
  height: 100%;
  box-sizing: border-box;
  background-color: black;
  padding: 60px 0 0 120px;
}

.lq-legal.small-screen {
  padding: 40px 0 0 60px;
}

.lq-legal .home-button {
  flex-shrink: 0;     /* Needed for old browsers, at least Safari on iOS 12 */
  align-self: flex-start;
}

.lq-legal img.logo {
  height: 84px;
}

.lq-legal.small-screen img.logo {
  height: 64px;
}

.lq-legal .lq-language-switch {
  position: absolute;
  top: 16px;
  right: 16px;
}

.lq-legal .heading {
  color: var(--primary-color);
  font-size: 24px;
  margin-top: 42px;
}

.lq-legal .scroll-container {
  overflow: auto;
  flex-grow: 1;
  margin-top: 24px;
  padding-right: 34%;
}

.lq-legal.small-screen .scroll-container {
  padding-right: 18px;
}

.lq-legal .text {
  color: white;
  margin-bottom: 24px;
}
</style>
