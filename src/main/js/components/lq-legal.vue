<template>
  <div :class="['lq-legal', routeName]">
    <lq-language-switch></lq-language-switch>
    <el-button class="home-button" type="text" @click="home"><img :src="logo"></el-button>
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
      this.$store.dispatch('getLegalText', this.routeName).then(html => {
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
  background-image: url("../../resources-build/zw-snake.png");
  background-position: bottom right;
  background-repeat: no-repeat;
  padding: 50px 0 0 120px;
}

.lq-legal .home-button {
  align-self: flex-start;
  margin-left: -81px;
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

.lq-legal .text {
  color: white;
  margin-bottom: 24px;
}

.lq-legal.imprint h4 {
  margin-bottom: 0;
}

.lq-legal.privacy_policy h2 {
  font-size: 20px;
  line-height: normal;
  margin-top: 32px;
  margin-bottom: 14px;
}

.lq-legal.privacy_policy ol {
  list-style-type: lower-alpha;
}

.lq-legal.privacy_policy p,
.lq-legal.privacy_policy ul > li {
  font-family: serif;
  text-align: justify;
}

.lq-legal.privacy_policy table {
  border-collapse: collapse;
  margin-bottom: 2em;
}

.lq-legal.privacy_policy table td {
  border: 1px solid #bfbfbf;
  padding: 10px;
}

.lq-legal.privacy_policy table td p {
  text-align: initial;
}

.lq-legal.privacy_policy ul > li {
  margin-top: 4px;
  margin-bottom: 4px;
}

.lq-legal.privacy_policy ol > li {
  margin-top: 12px;
  margin-bottom: 12px;
}

.lq-legal.privacy_policy ol > li > div {
  font-weight: bold;
  margin-bottom: 4px;
}
</style>
