<template>
  <div class="lq-canvas-search">
    <el-input v-model="searchTerm" :placeholder="placeholder">
      <template #suffix>
        <span v-if="!searchTerm" class="fa fa-search"></span>
        <span v-else class="clickable fa fa-times" @click="clearSearch"></span>
      </template>
    </el-input>
    <div class="browse">
      <template v-if="searchTerm">
        <el-button type="primary" link class="fa fa-caret-left" :disabled="disPrev" @click="prevMatch"></el-button>
        <el-button type="primary" link class="fa fa-caret-right" :disabled="disNext" @click="nextMatch"></el-button>
        <span :class="['match-info', {'no-match': noMatch}, 'label']">{{matchInfo}}</span>
      </template>
    </div>
  </div>
</template>

<script>
import lq from '../lq-globals'

export default {

  mixins: [
    require('./mixins/screen').default
  ],

  computed: {

    placeholder () {
      return lq.getString('label.search')
    },

    matchInfo () {
      if (this.noMatch) {
        return '0'
      } else {
        return `${this.matchIndex + 1} ${lq.getString('label.of')} ${this.matches.length}`
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
      this.searchTerm = ''
    }
  }
}
</script>

<style>
.lq-canvas-search {
  display: flex;
  align-items: center;
}

.lq-canvas-search .el-input {
  min-width: 120px;
  max-width: 160px;
  height: 30px;
}

/* always rendered to reserve horizontal space */
.lq-canvas-search .browse {
  width: 84px;
  flex: none;
  margin-left: 10px;
  display: flex;
  align-items: center;
}

.lq-canvas-search .browse .el-button {
  font-size: 22px;
}

.lq-canvas-search .browse .match-info {
  margin-left: 10px;
  white-space: nowrap;
}

.lq-canvas-search .browse .match-info.no-match {
  color: var(--danger-color) !important;    /* overrides .label color which is !important as well! */
}

.lq-canvas-search .clickable {
  cursor: pointer;
}
</style>
