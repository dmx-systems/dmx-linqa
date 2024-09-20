import Quill from 'quill';
import EmojiBlot from './emoji-blot';
import EmojiCompletion from './emoji-completion-module';
import EmojiPicker from './emoji-picker-module';
import '../css/quill-emoji.css';

Quill.register({
    'formats/emoji': EmojiBlot,
    'modules/emoji-completion': EmojiCompletion,
    'modules/emoji-picker': EmojiPicker
}, true);

export default { EmojiBlot, EmojiCompletion, EmojiPicker };
