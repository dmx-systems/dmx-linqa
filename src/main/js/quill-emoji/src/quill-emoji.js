import Quill from 'quill';
import EmojiBlot from './emoji-blot';
import EmojiCompletionModule from './emoji-completion-module';
import EmojiPickerModule from './emoji-picker-module';
import '../css/quill-emoji.css';

Quill.register({
    'formats/emoji': EmojiBlot,
    'modules/emoji-completion': EmojiCompletionModule,
    'modules/emoji-picker': EmojiPickerModule
}, true);

export default { EmojiBlot, EmojiCompletionModule, EmojiPickerModule };
