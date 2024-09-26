export default {

  emojiToString(emoji) {
      return String.fromCodePoint(...this.parseUnicode(emoji.unicode))
  },

  parseUnicode(string) {
    // unicode can be '1f1f5-1f1ea', see emoji-list.js.
    return string.split('-').map(str => parseInt(str, 16));
  }
}
