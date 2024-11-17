import emojiData from "./emoji-data";

const emojiMap = {} /* = emojiData.reduce((emoji, map) => {   // reduce() is very slow (in Firefox/Mac)
  console.log(emoji.emoji_order)
  map[emoji.name] = emoji
  return map
}, {}) */

// console.log('Emojis:', emojiData.length)
emojiData.forEach(emoji => {
  emojiMap[emoji.name] = emoji
})

export default {

  getEmoji(name) {
    return emojiMap[name]
  },

  emojiToString(emoji) {
      return String.fromCodePoint(...this.parseUnicode(emoji.unicode))
  },

  parseUnicode(string) {
    // unicode can be '1f1f5-1f1ea', see emoji-data.js.
    return string.split('-').map(str => parseInt(str, 16));
  }
}
