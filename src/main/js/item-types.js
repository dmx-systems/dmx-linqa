import dmx from 'dmx-api'
import lq from './lq-globals'

export default {
  getViewModel,
  getSearchableText
}

function getViewModel (topic, rootState) {
  switch (topic.typeUri) {
  case 'linqa.document':
    return documentViewModel(topic, rootState)
  case 'linqa.note':
    return noteViewModel(topic, rootState)
  case 'linqa.textblock':
    return textblockViewModel(topic)
  case 'linqa.heading':
    return headingViewModel(topic, rootState)
  }
}

function getSearchableText (topic, rootState) {
  switch (topic.typeUri) {
  case 'linqa.document':
    return documentViewModel(topic, rootState)
  case 'linqa.note':
    return dmx.utils.stripHtml(noteViewModel(topic, rootState))
  case 'linqa.textblock':
    const vm = textblockViewModel(topic)
    return dmx.utils.stripHtml(vm.lang1st) +
           dmx.utils.stripHtml(vm.lang2nd)
  case 'linqa.heading':
    return headingViewModel(topic, rootState)
  }
}

// Note -- Basically copied from lq-document.vue

function documentViewModel (topic, state) {
  const docNames = {
    lang1: topic.children['linqa.document_name#linqa.lang1']?.value,
    lang2: topic.children['linqa.document_name#linqa.lang2']?.value
  }
  return docNames[docLang(docNames, state)]

  function docLang (docNames, state) {
    if (docNames.lang1 && docNames.lang2) {
      return lq.langSuffix(state.lang)
    } else if (docNames.lang1) {
      return 'lang1'
    } else if (docNames.lang2) {
      return 'lang2'
    }
  }
}

// Note -- Basically copied from lq-note.vue

function noteViewModel (topic, state) {
  const note = {
    lang1: html('lang1'),
    lang2: html('lang2')
  }
  return note[noteLang(note, state)]

  /**
   * @param   lang    URI suffix
   */
  function html (lang) {
    // Note: in an untranslatable note "lang2" is not defined
    const html = topic.children['linqa.note_text#linqa.' + lang]?.value
    if (html !== '<p><br></p>') {
      return html
    }
  }

  function noteLang (note, state) {
    if (note.lang1 && note.lang2) {
      return lq.langSuffix(state.lang)
    } else if (note.lang1) {
      return 'lang1'
    } else if (note.lang2) {
      return 'lang2'
    }
  }
}

// Textblock -- Basically copied from lq-textblock.vue

function textblockViewModel (topic) {
  const textblock = {
    lang1: html('lang1'),
    lang2: html('lang2')
  }
  const l = lang(topic)
  return {
    lang1st: textblock[l.lang1st],
    lang2nd: textblock[l.lang2nd]
  }

  /**
   * @param   lang    URI suffix
   */
  function html (lang) {
    // Note: in an untranslatable textblock "lang2" is not defined
    const html = topic.children['linqa.textblock_text#linqa.' + lang]?.value
    if (html !== '<p><br></p>') {
      return html
    }
  }
}

// Heading -- Basically copied from lq-heading.vue

function headingViewModel (topic, state) {
  const heading = {
    lang1: topic.children['linqa.heading_text#linqa.lang1']?.value,
    lang2: topic.children['linqa.heading_text#linqa.lang2']?.value
  }
  return heading[headingLang(heading, state)]

  function headingLang (heading, state) {
    if (heading.lang1 && heading.lang2) {
      return lq.langSuffix(state.lang)
    } else if (heading.lang1) {
      return 'lang1'
    } else if (heading.lang2) {
      return 'lang2'
    }
  }
}

// -- Basically copied from translation.js mixin

function lang (topic) {
  const ol = origLang(topic)
  const tl = translatedLang(ol)
  return {
    lang1st: ol || 'lang1',
    lang2nd: tl || 'lang2'
  }
}

/**
 * The topic's original language (URI suffix) as stored in DB, or undefined for a topic which could not be
 * translated (resp. is not translated yet, the latter happens for "Document").
 */
function origLang (topic) {
  // Note 1: an untranslatable topic has no "Original Language".
  // Note 2: only for Documents newFormModel() is called at creation time (see newDocumentViewTopic() in
  // lq-canvas.vue). In this case "Original Language" exists but has empty value. In contrast for the other content
  // objects (Notes, Textblocks etc.) newFormModel() is only called when editing (see edit() in lq-canvas-item.vue).
  const lang = topic.children['linqa.language#linqa.original_language']?.value
  if (lang) {
    return lq.langSuffix(lang)
  }
}

/**
 * The topic's translation language (URI suffix), or undefined for an untranslatable topic.
 */
function translatedLang (origLang) {
  if (origLang === 'lang1') {
    return 'lang2'
  } else if (origLang === 'lang2') {
    return 'lang1'
  }
}
