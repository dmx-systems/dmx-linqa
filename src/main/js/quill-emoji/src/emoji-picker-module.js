import Quill from 'quill';
import Fuse from 'fuse.js';
import emojiList from './emoji-list.js';

const Delta = Quill.import('delta');
const Module = Quill.import('core/module');

/**
 * Adds a button (CSS class 'emoji-picker-button') to the Quill textarea to open an emoji picker.
 */
class EmojiPickerModule extends Module {

    constructor(quill, options) {
        super(quill, options);
        this.quill = quill;
        this.container = document.createElement('div');     // the button to open the picker
        this.container.classList.add('emoji-picker-button');
        this.container.innerHTML = options.buttonIcon;
        this.quill.container.appendChild(this.container);
        this.container.addEventListener('click', this.openEmojiPicker.bind(this), false);
    }

    openEmojiPicker() {
        const pickerExists = document.getElementById('emoji-picker');
        if (pickerExists) {
            pickerExists.remove();
        } else {
            const emojiPicker = document.createElement('div');
            emojiPicker.id = 'emoji-picker';
            this.quill.container.appendChild(emojiPicker);
            const tabToolbar = document.createElement('div');
            tabToolbar.id = 'tab-toolbar';
            emojiPicker.appendChild(tabToolbar);
            const emojiTypes = [
                {'type': 'p', 'name': 'people',   'content': '<div class="i-people"></div>'},
                {'type': 'n', 'name': 'nature',   'content': '<div class="i-nature"></div>'},
                {'type': 'd', 'name': 'food',     'content': '<div class="i-food"></div>'},
                {'type': 's', 'name': 'symbols',  'content': '<div class="i-symbols"></div>'},
                {'type': 'a', 'name': 'activity', 'content': '<div class="i-activity"></div>'},
                {'type': 't', 'name': 'travel',   'content': '<div class="i-travel"></div>'},
                {'type': 'o', 'name': 'objects',  'content': '<div class="i-objects"></div>'},
                {'type': 'f', 'name': 'flags',    'content': '<div class="i-flags"></div>'}
            ];
            const tabElementHolder = document.createElement('ul');
            tabToolbar.appendChild(tabElementHolder);
            if (document.getElementById('emoji-picker-mask') === null) {
                const pickerMask = document.createElement('div');
                pickerMask.id = 'emoji-picker-mask';
                pickerMask.addEventListener('click', closeEmojiPicker, false);
                document.getElementsByTagName('body')[0].appendChild(pickerMask);
            } else {
                document.getElementById('emoji-picker-mask').style.display = 'block';
            }
            const panel = document.createElement('div');
            panel.id = 'tab-panel';
            emojiPicker.appendChild(panel);
            const innerQuill = this.quill;
            emojiTypes.map(function(emojiType) {
                const tabElement = document.createElement('li');
                tabElement.classList.add('emoji-tab');
                tabElement.classList.add('filter-' + emojiType.name);
                const tabValue = emojiType.content;
                tabElement.innerHTML = tabValue;
                tabElement.dataset.filter = emojiType.type;
                tabElementHolder.appendChild(tabElement);
                const emojiFilter = document.querySelector('.filter-' + emojiType.name);
                emojiFilter.addEventListener('click', function() {
                    const emojiContainer = document.getElementById('emoji-picker');
                    const tab = emojiContainer && emojiContainer.querySelector('.active');
                    if (tab) {
                        tab.classList.remove('active');
                    }
                    emojiFilter.classList.toggle('active');
                    while (panel.firstChild) {
                        panel.removeChild(panel.firstChild);
                    }
                    const type = emojiFilter.dataset.filter;
                    addEmojisToPanel(type, panel, innerQuill);
                })
            });
            const windowHeight = window.innerHeight;
            const editorPos = this.quill.container.getBoundingClientRect().top;
            if (editorPos > windowHeight / 2) {
                emojiPicker.style.top = '-250px';
            }
            initEmojiPicker(panel, this.quill);
        }
    }
}

EmojiPickerModule.DEFAULTS = {
  buttonIcon: '<svg viewbox="0 0 18 18"><circle class="ql-fill" cx="7" cy="7" r="1"></circle><circle class="ql-fill" cx="11" cy="7" r="1"></circle><path class="ql-stroke" d="M7,10a2,2,0,0,0,4,0H7Z"></path><circle class="ql-stroke" cx="9" cy="9" r="6"></circle></svg>'
}

function closeEmojiPicker() {
    const emojiPicker = document.getElementById('emoji-picker');
    document.getElementById('emoji-picker-mask').style.display = 'none';
    if (emojiPicker) {emojiPicker.remove()}
}

function initEmojiPicker(panel, quill) {
    addEmojisToPanel('p', panel, quill);
    document.querySelector('.filter-people').classList.add('active');
}

/**
 * Adds all emojis of the given type to the given panel.
 */
function addEmojisToPanel(type, panel, quill) {
    const fuseOptions = {
        shouldSort: true,
        matchAllTokens: true,
        threshold: 0.3,
        location: 0,
        distance: 100,
        maxPatternLength: 32,
        minMatchCharLength: 3,
        keys: [
            'category'
        ]
    };
    const fuse = new Fuse(emojiList, fuseOptions);
    const result = fuse.search(type);
    result.sort(function (a, b) {
      return a.emoji_order - b.emoji_order;
    });
    //
    quill.focus();
    const range = quill.getSelection();
    //
    result.map(function(emoji) {
        const span = document.createElement('span');
        const t = document.createTextNode(emoji.shortname);
        span.appendChild(t);
        span.classList.add('bem');
        span.classList.add('bem-' + emoji.name);
        const output = '' + emoji.code_decimal + '';
        span.innerHTML = output + ' ';
        panel.appendChild(span);
        //
        const customButton = document.querySelector('.bem-' + emoji.name);
        if (customButton) {
            customButton.addEventListener('click', function() {
                // quill.insertText(range.index, customButton.innerHTML);
                // quill.setSelection(range.index + customButton.innerHTML.length, 0);
                // range.index = range.index + customButton.innerHTML.length;
                quill.insertEmbed(range.index, 'emoji', emoji, Quill.sources.USER);
                setTimeout(() => quill.setSelection(range.index + 1), 0);
                closeEmojiPicker();
            });
        }
    });
}

export default EmojiPickerModule;
