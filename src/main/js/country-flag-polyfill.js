import {polyfillCountryFlagEmojis} from "country-flag-emoji-polyfill"
const isNeeded = polyfillCountryFlagEmojis()
console.log('[Linqa] country-flag-emoji-polyfill:', isNeeded)
