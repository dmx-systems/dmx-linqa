import dmx from 'dmx-api'
import lq from '../lq-globals'
import it from '../item-types'

export default {

  namespaced: true,

  state: {
    searchTerm: '',
    matches: [],        // search result (array of plain topics)
    matchIndex: 0       // current match (Number)
  },

  actions: {

    search ({state, rootState, dispatch}, searchTerm) {
      state.searchTerm = searchTerm
      state.matches = []
      state.matchIndex = 0
      if (state.searchTerm) {
        // Note: the filter is needed as arbitrary topics could be revealed via DMX Webclient
        rootState.topicmap.topics.filter(lq.canvasFilter).forEach(topic => {
          const text = it.getSearchableText(topic, rootState)
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
          showMatch(state, dispatch)
        }
      }
    },

    prevMatch ({state, dispatch}) {
      state.matchIndex--
      showMatch(state, dispatch)
    },

    nextMatch ({state, dispatch}) {
      state.matchIndex++
      showMatch(state, dispatch)
    }
  }
}

// TODO: drop it, not used
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

function showMatch (state, dispatch) {
  dispatch('revealTopic', state.matches[state.matchIndex], {root: true})
}
