import dmx from 'dmx-api'
import lq from '../lq-globals'

const state = {
  searchTerm: '',
  matches: [],        // search result (array of plain topics)
  matchIndex: 0       // current match (Number)
}

const actions = {

  search ({rootState, dispatch}, searchTerm) {
    state.searchTerm = searchTerm
    state.matches = []
    state.matchIndex = 0
    if (state.searchTerm) {
      // Note: the filter is needed as arbitrary topics could be revealed via DMX Webclient
      rootState.topicmap.topics.filter(lq.canvasFilter).forEach(topic => {
        const text = itemText(topic)
        if (text) {
          // TODO: locale lower case?
          const i = text.toLowerCase().indexOf(state.searchTerm.toLowerCase())
          if (i >= 0) {
            state.matches.push(topic)
          }
        }
      })
      // console.log('search', state.searchTerm, state.matches.length)
      if (state.matches.length) {
        showMatch(dispatch)
      }
    }
  },

  prevMatch ({dispatch}) {
    state.matchIndex--
    showMatch(dispatch)
  },

  nextMatch ({dispatch}) {
    state.matchIndex++
    showMatch(dispatch)
  }
}

export default {
  namespaced: true,
  state,
  actions
}

function itemText (topic) {
  // TODO: refactor
  const vm = document.querySelector(`.lq-canvas-item[data-id="${topic.id}"] .item-content`).__vue__
  switch (topic.typeUri) {
  case 'linqa.document':
    return vm.docName
  case 'linqa.note':
    return dmx.utils.stripHtml(vm.noteHtml)
  case 'linqa.textblock':
    return dmx.utils.stripHtml(vm.textblock.lang1) +
           dmx.utils.stripHtml(vm.textblock.lang2)
  case 'linqa.heading':
    return vm.headingText
  }
}

function showMatch (dispatch) {
  dispatch('revealTopic', state.matches[state.matchIndex], {root: true})
}
