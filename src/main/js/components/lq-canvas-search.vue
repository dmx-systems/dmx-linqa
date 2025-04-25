<template>
  <div :class="['lq-canvas-search', {'small-screen': isSmallScreen}]">
    <el-input v-model="searchTerm" :placeholder="placeholder">
      <template #suffix>
        <el-icon v-if="!searchTerm" class="fa fa-search"><search /></el-icon>
        <el-icon v-else class="lq-clickable fa fa-times" @click="clearSearch()"><search /></el-icon>
      </template>
    </el-input>
    <!-- <el-input v-model="searchTerm" :placeholder="placeholder"></el-input> -->
    <div v-if="searchTerm" class="lq-search-results">
      <el-button type="primary" link class="admin-button fa fa-caret-left" :disabled="disPrev" @click="prevMatch"></el-button>
      <el-button type="primary" link class="admin-button fa fa-caret-right" :disabled="disNext" @click="nextMatch"></el-button>
      <span :class="['match-info', {'no-match': noMatch}, 'secondary']">{{matchInfo}}</span>
    </div>
  </div>
</template>

<script>
import lq from '../lq-globals'
import { Calendar, Search } from '@element-plus/icons-vue'

export default {

  mixins: [
    require('./mixins/screen').default
  ],

  computed: {

    placeholder () {
      return lq.getString('label.search')
    },

    matchInfo () {
      // Note: match-info DOM is always rendered to reserve horizontal space
      if (this.searchTerm) {
        if (this.noMatch) {
          return '0'
        } else {
          return `${this.matchIndex + 1} ${lq.getString('label.of')} ${this.matches.length}`
        }
      }
    },

    noMatch () {
      return !this.matches.length
    },

    disPrev () {
      return this.matchIndex == 0
    },

    disNext () {
      return this.matchIndex == this.matches.length - 1 || this.noMatch
    },

    searchTerm: {
      get () {
        return this.$store.state.search.searchTerm
      },
      set (searchTerm) {
        this.$store.dispatch('search/search', searchTerm)
      }
    },

    matches () {
      return this.$store.state.search.matches
    },

    matchIndex () {
      return this.$store.state.search.matchIndex
    }
  },

  methods: {

    prevMatch () {
      this.$store.dispatch('search/prevMatch')
    },

    nextMatch () {
      this.$store.dispatch('search/nextMatch')
    },

    clearSearch () {
      return this.$store.dispatch('search/search', '')
    }
  }
}
</script>

<style>

.lq-clickable {
  cursor: pointer;
}

.lq-canvas-search {
  display: flex;
  align-items: center;
  margin-right: 20px;
}

.lq-canvas-search .el-input {
  min-width: 140px;
}

.lq-canvas-search.small-screen .el-input {
  width: 78px;
}

.lq-canvas-search .el-input__inner {
  height: 32px;
}

.lq-canvas-search .el-button:nth-of-type(1) {
  margin-left: 5px;
}

.lq-canvas-search .el-button:nth-of-type(2) {
  margin-left: 0px;
}

.lq-canvas-search .match-info {
  margin-left: 0px;
  margin-top: 3px !important;
}

.lq-canvas-search .lq-search-results {
  min-width: 110px;
  margin-right: 10px;
  display: flex;
}

.lq-canvas-search .lq-search-results .match-info .secondary{
  margin-top: -20px;
}

.lq-canvas-search .match-info.no-match {
  color: var(--color-danger);
}

</style>
