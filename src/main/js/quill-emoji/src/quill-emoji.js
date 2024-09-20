import Quill from 'quill';
import EmojiCompletionModule from './emoji-completion-module';
import EmojiPickerModule from './emoji-picker-module';
import '../css/quill-emoji.css';

Quill.register({
    'modules/emoji-completion': EmojiCompletionModule,
    'modules/emoji-picker': EmojiPickerModule
}, true);

export default { EmojiCompletionModule, EmojiPickerModule };
