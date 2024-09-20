import Quill from 'quill';
import emojiMap from "./emoji-map";

const Embed = Quill.import('blots/embed');

class EmojiBlot extends Embed {
  static create(value) {
    let node = super.create();
    if (typeof value === 'object') {
      EmojiBlot.buildSpan(value, node);
    } else if (typeof value === "string") {
      const valueObj = emojiMap[value];
      if (valueObj) {
        EmojiBlot.buildSpan(valueObj, node);
      }
    }
    return node;
  }

  static value(node) {
    return node.dataset.name;
  }

  static buildSpan(value, node) {
    node.setAttribute('data-name', value.name);
    // unicode can be '1f1f5-1f1ea',see emoji-list.js.
    node.innerText = String.fromCodePoint(...EmojiBlot.parseUnicode(value.unicode));
  }

  static parseUnicode(string) {
    return string.split('-').map(str => parseInt(str, 16));
  }
}

EmojiBlot.blotName = 'emoji';
EmojiBlot.tagName = 'span';

export default EmojiBlot;
