import Quill from 'quill';
import Fuse from 'fuse.js';
import emojiList from './emoji-list.js';
import utils from './emoji-utils.js';

const Module = Quill.import('core/module');

const MAX_MENU_ITEMS = 10

/**
 * Adds a menu of possible emoji completions (CSS class 'emoji-completions') to the Quill container.
 * Invoked by colon key (:), completions are filtered then during typing.
 */
class EmojiCompletionModule extends Module {

  constructor(quill, options) {
    console.log('EmojiCompletionModule', options, quill.container)
    super(quill, options);
    //
    this.emojiList = options.emojiList;
    this.fuse      = new Fuse(options.emojiList, options.fuse);
    this.quill     = quill;
    this.onClose   = options.onClose;
    this.onOpen    = options.onOpen;
    this.container = document.createElement('ul');                // the emoji menu (<ul> element)
    this.container.classList.add('emoji-completions');
    this.quill.container.appendChild(this.container);
    this.container.style.position = 'absolute';
    this.container.style.display  = 'none';
    //
    this.onSelectionChange = this.maybeUnfocus.bind(this);        // registered while completion mode is active
    this.onTextChange      = this.updateCompletions.bind(this);   // registered while completion mode is active
    //
    this.open          = false;     // true while completion mode is active
    this.atIndex       = null;      // cursor position where completion mode was activated, *before* colon char (Number)
    this.query         = null;      // while completion mode: search term entered after colon char (String)
    this.buttons       = null;      // while completion mode: buttons shown in emoji menu (array of DOM elememts)
    this.focusedButton = null;
    //
    quill.keyboard.addBinding({
      key: 186, // Colon (Chrome/Safari/German Keyboard)
      shiftKey: true,
    }, this.openCompletions.bind(this));
    quill.keyboard.addBinding({
      key: 190, // Colon (Chrome/Safari/US keyboard + Firefox)
      shiftKey: true,
    }, this.openCompletions.bind(this));
    quill.keyboard.addBinding({
      key: 39,  // ArrowRight
      collapsed: true
    }, this.handleArrow.bind(this));
    quill.keyboard.addBinding({
      key: 40,  // ArrowDown
      collapsed: true
    }, this.handleArrow.bind(this));
    // TODO: Add keybindings for Enter (13) and Tab (9) directly on the quill editor
  }

  /**
   * Key handler invoked by colon key.
   * Enters "completions mode" (sets this.open to true). Calculates menu position and registers key handlers.
   * The menu is not actually opened (but only on next key press).
   */
  openCompletions(range, context) {
    console.log('openCompletions', this.open, range.index)
    if (this.open) {
      return true;
    }
    if (range.length > 0) {
      this.quill.deleteText(range.index, range.length, Quill.sources.USER);
    }
    //
    this.quill.insertText(range.index, ':', Quill.sources.USER);
    const atSignBounds = this.quill.getBounds(range.index);
    this.quill.setSelection(range.index + 1, Quill.sources.SILENT);
    //
    this.atIndex = range.index;
    //
    let paletteMaxPos = atSignBounds.left + 250;
    if (paletteMaxPos > this.quill.container.offsetWidth) {
      this.container.style.left = (atSignBounds.left - 250) + 'px';
    } else {
      this.container.style.left = atSignBounds.left + 'px';
    }
    //
    this.container.style.top = atSignBounds.top + atSignBounds.height + 'px';
    this.open = true;
    //
    this.quill.on('text-change', this.onTextChange);
    this.quill.once('selection-change', this.onSelectionChange);
    this.onOpen && this.onOpen();
  }

  /**
   * Key handler invoked while in "completion mode" ("this" is the module instance).
   * Filters emojis by current "query" and updates the completion menu accordingly.
   */
  updateCompletions() {
    const sel = this.quill.getSelection().index;
    if (this.atIndex >= sel) {    // Deleted the at character
      console.log('updateCompletions --> abort', this.atIndex, sel)
      return this.closeCompletions(null);
    }
    //
    // calculate "query"
    this.query = this.quill.getText(this.atIndex + 1, sel - this.atIndex - 1);
    console.log('updateCompletions', `"${this.query}"`, this.query.length, /\s/.test(this.query))
    if (/\s/.test(this.query)) {      // typing whitespace leaves "completion mode"
      this.closeCompletions(null);
      return;
    }
    this.query = this.query.trim();   // TODO: needed?
    //
    // search emojis (using fuse.js)
    let emojis = this.fuse.search(this.query).sort((a, b) => a.emoji_order - b.emoji_order);
    if (this.query.length < this.options.fuse.minMatchCharLength || emojis.length === 0){
      this.container.style.display = 'none';    // close menu w/o leaving "completion mode"
      return;
    }
    if (emojis.length > MAX_MENU_ITEMS) {
      emojis = emojis.slice(0, MAX_MENU_ITEMS);
    }
    this.renderCompletions(emojis);
  }

  renderCompletions(emojis) {
    console.log('renderCompletions', emojis.length)
    if (event) {
      if (event.key === 'Enter' || event.keyCode === 13) {
        console.log('  Enter (editor) -->', emojis[0].name)
        this.closeCompletions(emojis[0], 1);
        this.container.style.display = 'none';
        return;
      } else if (event.key === 'Tab' || event.keyCode === 9) {
        console.log('  Tab --> move focus from editor to menu')
        this.quill.disable();
        this.buttons[0].classList.remove('emoji-active');
        this.buttons[1].focus();
        return;
      }
    }
    // clear menu
    while (this.container.firstChild){
      this.container.removeChild(this.container.firstChild);
    }
    this.buttons = [];
    //
    // add emojis to menu (<li> elements containing a <button>)
    emojis.forEach((emoji, i) => {
      const li = createElement('li', {}, createElement(
        'button', {type: 'button'},
        createElement('span', {innerHTML: emoji.code_decimal}),
        createElement('span', {className: 'label'}, emoji.name)    // Note: 'label' is Linqa class
      ));
      this.container.appendChild(li);
      this.buttons[i] = li.firstChild;
      // event handlers will be GC-ed on each re-render
      this.buttons[i].addEventListener('keydown', this.createMenuKeyHandler(i, emoji));
      this.buttons[i].addEventListener('mousedown', () => this.closeCompletions(emoji));
      this.buttons[i].addEventListener('focus', () => this.focusedButton = i);
      this.buttons[i].addEventListener('unfocus', () => this.focusedButton = null);
    });
    //
    this.container.style.display = 'block';
    // position completions above cursor
    const height = window.innerHeight;
    const top = this.quill.container.getBoundingClientRect().top;
    if (top > height / 2 && this.container.offsetHeight > 0) {
      this.container.style.top = '-' + this.container.offsetHeight + 'px';
    }
    //
    this.buttons[0].classList.add('emoji-active');
  }

  createMenuKeyHandler(i, emoji) {
    return event => {
      const buttons = this.buttons
      if (event.key === 'ArrowRight' || event.keyCode === 39) {
        event.preventDefault();
        buttons[Math.min(buttons.length - 1, i + 1)].focus();
      } else if (event.key === 'Tab' || event.keyCode === 9) {
        event.preventDefault();
        if ((i + 1) === buttons.length) {
          buttons[0].focus();
          return;
        }
        buttons[Math.min(buttons.length - 1, i + 1)].focus();
      } else if (event.key === 'ArrowLeft' || event.keyCode === 37) {
        event.preventDefault();
        buttons[Math.max(0, i - 1)].focus();
      } else if (event.key === 'ArrowDown' || event.keyCode === 40) {
        event.preventDefault();
        buttons[Math.min(buttons.length - 1, i + 1)].focus();
      } else if (event.key === 'ArrowUp' || event.keyCode === 38) {
        event.preventDefault();
        buttons[Math.max(0, i - 1)].focus();
      } else if (event.key === 'Enter' || event.keyCode === 13
               || event.key === ' ' || event.keyCode === 32
               || event.key === 'Tab' || event.keyCode === 9) {
        console.log('  Enter/Space/Tab -->', emoji.name)
        event.preventDefault();
        this.quill.enable();
        this.closeCompletions(emoji);
      }
    }
  }

  /**
   * Leaves "completions mode" (sets this.open to false).
   * Closes the completions menu. Inserts the emoji, if given.
   */
  closeCompletions(emoji, trailingDelete = 0) {
    console.log('closeCompletions', emoji?.name, trailingDelete)
    this.quill.enable();
    this.container.style.display = 'none';
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    this.quill.off('selection-change', this.onSelectionChange);
    this.quill.off('text-change', this.onTextChange);
    //
    // insert emoji
    if (emoji) {
      const str = utils.emojiToString(emoji)
      this.quill.deleteText(this.atIndex, this.query.length + 1 + trailingDelete, Quill.sources.USER);
      this.quill.insertText(this.atIndex, str, Quill.sources.USER);
      setTimeout(() => this.quill.setSelection(this.atIndex + str.length), 0);
    }
    this.quill.focus();
    this.open = false;
    this.onClose && this.onClose(emoji);
  }

  handleArrow() {
    console.log('handleArrow (editor)', 'open', this.open)
    if (!this.open) {
      return true;
    }
    this.buttons[0].classList.remove('emoji-active');
    this.buttons[0].focus();
    if (this.buttons.length > 1) {
      this.buttons[1].focus();
    }
  }

  maybeUnfocus() {
    if (this.container.querySelector('*:focus')) {
      return;
    }
    this.closeCompletions(null);
  }
}

EmojiCompletionModule.DEFAULTS = {
  emojiList: emojiList,
  fuse: {
    shouldSort: true,
    threshold: 0.1,
    location: 0,
    distance: 100,
    maxPatternLength: 32,
    minMatchCharLength: 1,
    keys: [
      'shortname'
    ]
  }
};

function createElement(tag, attrs, ...children) {
  const elem = document.createElement(tag);
  Object.keys(attrs).forEach(key => elem[key] = attrs[key]);
  children.forEach(child => {
    if (typeof child === 'string') {
      child = document.createTextNode(child);
    }
    elem.appendChild(child);
  });
  return elem;
}

export default EmojiCompletionModule;
