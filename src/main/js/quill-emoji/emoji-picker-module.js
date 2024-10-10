import Quill from 'quill';
import Fuse from 'fuse.js';
import emojiData from './emoji-data.js';
import utils from './emoji-utils.js';

const Module = Quill.import('core/module');

const CATEGORIES = [
  {id: 'p', name: 'Smileys & People'},
  {id: 'n', name: 'Animals & Nature'},
  {id: 'd', name: 'Food & Drink'},
  {id: 's', name: 'Symbols'},
  {id: 'a', name: 'Activity'},
  {id: 't', name: 'Travel & Places'},
  {id: 'o', name: 'Objects'},
  {id: 'f', name: 'Flags'}
];

/**
 * Adds a button (CSS class 'emoji-picker-button') to the Quill container to open an emoji picker.
 */
class EmojiPickerModule extends Module {

  constructor(quill, options) {
    super(quill, options);
    this.button = document.createElement('div');    // the button to open the picker
    this.button.classList.add('emoji-picker-button');
    this.button.innerHTML = options.buttonIcon;
    this.button.addEventListener('click', this.openEmojiPicker.bind(this));
    this.quill = quill;
    this.quill.container.appendChild(this.button);
    this.fuse = new Fuse(emojiData, options.fuse);
  }

  openEmojiPicker() {
    let emojiPicker = document.getElementById('emoji-picker');
    if (emojiPicker) {
      this.closeEmojiPicker();
      return;
    }
    // this.createMask()    // TODO
    const catList = document.createElement('ul');
    const tabToolbar = document.createElement('div');
    tabToolbar.id = 'tab-toolbar';
    tabToolbar.appendChild(catList);
    const tabPanel = document.createElement('div');
    tabPanel.id = 'tab-panel';
    emojiPicker = document.createElement('div');
    emojiPicker.id = 'emoji-picker';
    emojiPicker.appendChild(tabToolbar);
    emojiPicker.appendChild(tabPanel);
    this.quill.container.appendChild(emojiPicker);
    CATEGORIES.forEach(cat => {
      const catItem = document.createElement('li');
      catItem.classList.add('emoji-tab');
      catItem.classList.add(cat.id);
      catItem.title = cat.name;
      catItem.innerHTML = '<div></div>';
      catItem.addEventListener('click', () => {
        emojiPicker.querySelector('.emoji-tab.active').classList.remove('active');
        catItem.classList.add('active');
        while (tabPanel.firstChild) {
          tabPanel.removeChild(tabPanel.firstChild);
        }
        this.addEmojisToPanel(cat.id, tabPanel);
      });
      catList.appendChild(catItem);
    });
    //
    const windowHeight = window.innerHeight;
    const editorPos = this.quill.container.getBoundingClientRect().top;
    if (editorPos > windowHeight / 2) {
      emojiPicker.style.top = '-250px';
    }
    this.initEmojiPicker(tabPanel);
  }

  /**
   * Adds all emojis of the given category to the given panel.
   */
  addEmojisToPanel(catId, panel) {
    const result = this.fuse.search(catId);
    result.sort((a, b) => a.emoji_order - b.emoji_order);
    //
    this.quill.focus();
    const range = this.quill.getSelection();
    //
    result.forEach(emoji => {
      const span = document.createElement('span');
      span.classList.add('emoji');
      span.title = emoji.name;
      span.innerHTML = emoji.code_decimal;
      span.addEventListener('click', () => {
        const str = utils.emojiToString(emoji)      // Note: emoji can consist of more than one character
        this.quill.insertText(range.index, str, Quill.sources.USER);
        setTimeout(() => this.quill.setSelection(range.index + str.length), 0);
        this.closeEmojiPicker();
      });
      panel.appendChild(span);
    });
  }

  createMask() {
    if (document.getElementById('emoji-picker-mask') === null) {
      const pickerMask = document.createElement('div');
      pickerMask.id = 'emoji-picker-mask';
      pickerMask.addEventListener('click', this.closeEmojiPicker);
      document.body.appendChild(pickerMask);
    } else {
      document.getElementById('emoji-picker-mask').style.display = 'block';
    }
  }

  initEmojiPicker(panel) {
    this.addEmojisToPanel('p', panel);    // "p" = people category
    document.querySelector('li.emoji-tab.p').classList.add('active');
  }

  closeEmojiPicker() {
    const emojiPicker = document.getElementById('emoji-picker');
    // document.getElementById('emoji-picker-mask').style.display = 'none';     // TODO
    if (emojiPicker) {
      emojiPicker.remove();
    }
  }
}

EmojiPickerModule.DEFAULTS = {
  buttonIcon: `<svg viewbox="0 0 18 18">
    <circle class="ql-fill" cx="7" cy="7" r="1"></circle>
    <circle class="ql-fill" cx="11" cy="7" r="1"></circle>
    <path class="ql-stroke" d="M7,10a2,2,0,0,0,4,0H7Z"></path>
    <circle class="ql-stroke" cx="9" cy="9" r="6"></circle>
  </svg>`,
  fuse: {
    shouldSort: true,
    matchAllTokens: true,
    threshold: 0.3,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 3,
    keys: ['category']
  }
};

export default EmojiPickerModule;
