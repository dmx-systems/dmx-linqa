import { nextTick } from 'vue'
import store from './store/linqa'
import dmx from 'dmx-api'

export default message => {
  const topicmap = store.state.topicmap     // Note: is undefined if app is launched directly into admin area
  switch (message.type) {
  case 'addComment':
    if (message.args.workspaceId === store.state.workspace.id) {
      const comment = message.args.comment
      store.dispatch('addComment', comment)
      nextTick(() => {
        store.dispatch('jumpToComment', {comment})
      })
    }
    break
  case 'addTopicToTopicmap':
    if (topicmap?.id === message.args.topicmapId) {
      topicmap.addTopic(new dmx.ViewTopic(message.args.viewTopic))
    }
    break
  case 'setTopicPosition':
    if (topicmap?.id === message.args.topicmapId) {
      const topic = topicmap.getTopicIfExists(message.args.topicId)
      if (topic) {
        topic.setPosition(message.args.pos)
        store.dispatch('updateControlBox')
      }
    }
    break
  case 'setViewProps':
    if (topicmap?.id === message.args.topicmapId) {
      const topic = topicmap.getTopicIfExists(message.args.topicId)
      if (topic) {
        const viewProps = message.args.viewProps
        for (const prop in viewProps) {
          const value = viewProps[prop]
          if (prop === 'linqa.color') {
            // Note: in contrast to other view props "color" is represented at client-side as a synthetic child value.
            // See comment in customizeTopic() in LinqaPlugin.java
            topic.children['linqa.color'] = {value}
          } else {
            topic.setViewProp(prop, value)
          }
        }
      }
    }
    break
  case 'processDirectives':
    message.args.forEach(directive => {
      let topic
      switch (directive.type) {
      case 'UPDATE_TOPIC':
        topic = directive.arg
        if (topic.typeUri === 'linqa.comment') {
          store.dispatch('replaceComment', topic)
        } else {
          const _topic = topicmap?.getTopicIfExists(topic.id)
          if (_topic) {
            topic.viewProps = _topic.viewProps
            topicmap.addTopic(new dmx.ViewTopic(topic))
            // TODO: better model support for replace-topic
          }
        }
        break
      case 'DELETE_TOPIC':
        topic = directive.arg
        if (topic.typeUri === 'linqa.comment') {
          store.dispatch('removeComment', topic)
        } else {
          topicmap?.removeTopic(topic.id)
        }
        break
      }
    })
    break
  }
}
