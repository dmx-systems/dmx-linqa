import Quill from 'quill';
import Fuse from 'fuse.js';
import emojiData from './emoji-data.js';
import utils from './emoji-utils.js';

const Module = Quill.import('core/module');

const CATEGORIES = [
  {type: 'p', name: 'people',   content: '<div class="i-people"></div>'},
  {type: 'n', name: 'nature',   content: '<div class="i-nature"></div>'},
  {type: 'd', name: 'food',     content: '<div class="i-food"></div>'},
  {type: 's', name: 'symbols',  content: '<div class="i-symbols"></div>'},
  {type: 'a', name: 'activity', content: '<div class="i-activity"></div>'},
  {type: 't', name: 'travel',   content: '<div class="i-travel"></div>'},
  {type: 'o', name: 'objects',  content: '<div class="i-objects"></div>'},
  {type: 'f', name: 'flags',    content: '<div class="i-flags"></div>'}
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
  }

  openEmojiPicker() {
    let emojiPicker = document.getElementById('emoji-picker');
    if (emojiPicker) {
      this.closeEmojiPicker();
      return;
    }
    emojiPicker = document.createElement('div');
    emojiPicker.id = 'emoji-picker';
    this.quill.container.appendChild(emojiPicker);
    const tabToolbar = document.createElement('div');
    tabToolbar.id = 'tab-toolbar';
    emojiPicker.appendChild(tabToolbar);
    const categoryList = document.createElement('ul');
    tabToolbar.appendChild(categoryList);
    // this.createMask()    // TODO
    const tabPanel = document.createElement('div');
    tabPanel.id = 'tab-panel';
    emojiPicker.appendChild(tabPanel);
    CATEGORIES.forEach(cat => {
      const catItem = document.createElement('li');
      catItem.classList.add('emoji-tab');
      catItem.classList.add('filter-' + cat.name);
      catItem.innerHTML = cat.content;
      catItem.dataset.filter = cat.type;
      categoryList.appendChild(catItem);
      const emojiFilter = document.querySelector('.filter-' + cat.name);
      emojiFilter.addEventListener('click', () => {
        const emojiContainer = document.getElementById('emoji-picker');
        const tab = emojiContainer && emojiContainer.querySelector('.active');
        if (tab) {
          tab.classList.remove('active');
        }
        emojiFilter.classList.toggle('active');
        while (tabPanel.firstChild) {
          tabPanel.removeChild(tabPanel.firstChild);
        }
        const type = emojiFilter.dataset.filter;
        this.addEmojisToPanel(type, tabPanel);
      });
    });
    const windowHeight = window.innerHeight;
    const editorPos = this.quill.container.getBoundingClientRect().top;
    if (editorPos > windowHeight / 2) {
      emojiPicker.style.top = '-250px';
    }
    this.initEmojiPicker(tabPanel);
  }

  /**
   * Adds all emojis of the given type to the given panel.
   */
  addEmojisToPanel(type, panel) {
    const fuseOptions = {
      shouldSort: true,
      matchAllTokens: true,
      threshold: 0.3,
      location: 0,
      distance: 100,
      maxPatternLength: 32,
      minMatchCharLength: 3,
      keys: ['category']
    };
    const fuse = new Fuse(emojiData, fuseOptions);
    const result = fuse.search(type);
    result.sort((a, b) => a.emoji_order - b.emoji_order);
    //
    this.quill.focus();
    const range = this.quill.getSelection();
    //
    result.forEach(emoji => {
      const span = document.createElement('span');
      span.classList.add('bem');
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
    this.addEmojisToPanel('p', panel);
    document.querySelector('.filter-people').classList.add('active');
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
  </svg>`
};

export default EmojiPickerModule;
