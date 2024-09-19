import Quill from 'quill';
import EmojiBlot from './format-emoji-blot';
import ShortNameEmoji from './module-emoji';
import TextAreaEmoji from './module-textarea-emoji';
import '../css/quill-emoji.css';

Quill.register({
    'formats/emoji': EmojiBlot,
    'modules/emoji-shortname': ShortNameEmoji,
    'modules/emoji-textarea': TextAreaEmoji
}, true);

export default { EmojiBlot, ShortNameEmoji, TextAreaEmoji };
