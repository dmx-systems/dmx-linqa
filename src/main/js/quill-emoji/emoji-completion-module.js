import Quill from 'quill';
import Fuse from 'fuse.js';
import emojiList from './emoji-list.js';
import utils from './emoji-utils.js';

const Module = Quill.import('core/module');

const MAX_MENU_ITEMS = 10
const DEFAULT_MENU_ITEMS = [
  'slightly_smiling_face', 'thumbsup', 'thumbsdown', 'heart_decoration', 'white_check_mark'
].map(utils.getEmoji)

/**
 * Adds a menu of possible emoji completions (CSS class 'emoji-menu') to the Quill container.
 * Invoked by colon key (:), completions are filtered then during typing.
 */
class EmojiCompletionModule extends Module {

  constructor(quill, options) {
    // console.log('EmojiCompletionModule', options, quill.container)
    super(quill, options);
    //
    this.emojiList = options.emojiList;
    this.fuse      = new Fuse(options.emojiList, options.fuse);
    this.quill     = quill;
    this.onClose   = options.onClose;
    this.onOpen    = options.onOpen;
    this.menu      = document.createElement('ul');                // the emoji menu (<ul> element)
    this.menu.classList.add('emoji-menu');
    this.quill.container.appendChild(this.menu);
    this.menu.style.position = 'absolute';
    this.menu.style.display  = 'none';
    //
    this.onSelectionChange = this.maybeUnfocus.bind(this);        // bound only during completion mode
    this.onTextChange      = this.updateCompletions.bind(this);   // bound only during completion mode
    //
    this.compMode      = false;     // signalizes completion mode
    this.colIndex      = null;      // cursor position when completion mode was entered, *before* colon char (Number)
    this.query         = '';        // during completion mode: search term entered after colon char (String)
    this.buttons       = null;      // during completion mode: buttons shown in emoji menu (array of DOM elememts)
    this.focusedButton = null;
    this.firstEmoji    = null;      // menu's first emoji (Object), inserted when Enter is pressed when editor has focus
    //
    quill.keyboard.addBinding({
      key: 186, // Colon (Chrome/Safari/German Keyboard)
      shiftKey: true,
    }, this.enterCompMode.bind(this));
    quill.keyboard.addBinding({
      key: 190, // Colon (Chrome/Safari/US keyboard + Firefox)
      shiftKey: true,
    }, this.enterCompMode.bind(this));
    quill.keyboard.addBinding({
      key: 39,  // ArrowRight
      collapsed: true
    }, this.handleArrow.bind(this));
    quill.keyboard.addBinding({
      key: 40,  // ArrowDown
      collapsed: true
    }, this.handleArrow.bind(this));
    // TODO: add keybindings for Enter (13) and Tab (9) statically in Quill configuration.
    // Note: dynmic binding (via quill.keyboard.addBinding()) does not work for these keys as Quill provides
    // default handlers which can only be overridden by Quill configuration.
    // But how to dispatch into the module from a statically configured key handler?
  }

  /**
   * Quill key handler invoked by colon key.
   * Enters completion mode (sets this.compMode to true), registers "text-change" and "selection-change" handlers.
   * Calculates menu position.
   * The menu is not actually opened (but only on next key press).
   */
  enterCompMode(range, context) {
    console.log('enterCompMode', 'compMode', this.compMode, 'index', range.index)
    if (this.compMode) {
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
    this.colIndex = range.index;
    //
    let paletteMaxPos = atSignBounds.left + 250;
    if (paletteMaxPos > this.quill.container.offsetWidth) {
      this.menu.style.left = (atSignBounds.left - 250) + 'px';
    } else {
      this.menu.style.left = atSignBounds.left + 'px';
    }
    //
    this.menu.style.top = atSignBounds.top + atSignBounds.height + 'px';
    this.compMode = true;
    //
    this.quill.on('text-change', this.onTextChange);
    this.quill.once('selection-change', this.onSelectionChange);
    this.onOpen && this.onOpen();
    //
    this.renderMenu(DEFAULT_MENU_ITEMS)
  }

  /**
   * "text-change" handler invoked during completion mode ("this" is the module instance).
   * Filters emojis by current "query" and updates the menu accordingly.
   */
  updateCompletions() {
    if (this.handleDefaultEditorKeys(this.firstEmoji)) {
      return
    }
    const index = this.quill.getSelection().index;
    console.log('### updateCompletions', 'colIndex', this.colIndex, 'index', index, this.quill.getText().split(),
      this.quill.getText().length)
    if (this.colIndex >= index) {       // Deleted the at character
      console.log('  --> abort', this.colIndex, index)
      this.leaveCompMode();
      return;
    }
    //
    // calculate "query"
    this.query = this.quill.getText(this.colIndex + 1, index - this.colIndex - 1);
    console.log('  query', `"${this.query}"`, 'len', this.query.length, 'whitespace', /\s/.test(this.query))
    if (/\s/.test(this.query)) {        // typing whitespace leaves completion mode
      this.leaveCompMode();
      return;
    }
    // this.query = this.query.trim();  // TODO: needed? Space ends completion mode.
    //                                     Enter/Tab does not contribute to "query".
    //
    // search emojis (using fuse.js)
    let emojis = this.fuse.search(this.query).sort((a, b) => a.emoji_order - b.emoji_order);
    if (this.query.length < this.options.fuse.minMatchCharLength || emojis.length === 0) {
      console.log('  --> no result')
      this.menu.style.display = 'none';    // close menu w/o leaving completion mode
      return;
    }
    if (emojis.length > MAX_MENU_ITEMS) {
      emojis = emojis.slice(0, MAX_MENU_ITEMS);
    }
    this.renderMenu(emojis);
  }

  renderMenu(emojis) {
    console.log('  renderMenu', 'items', emojis.length)
    this.firstEmoji = emojis[0]
    // clear menu
    while (this.menu.firstChild){
      this.menu.removeChild(this.menu.firstChild);
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
      this.menu.appendChild(li);
      this.buttons[i] = li.firstChild;
      // event handlers will be GC-ed on each re-render
      this.buttons[i].addEventListener('keydown', this.createMenuKeyHandler(i, emoji));
      this.buttons[i].addEventListener('mousedown', () => this.leaveCompMode(emoji));
      this.buttons[i].addEventListener('focus', () => this.focusedButton = i);
      this.buttons[i].addEventListener('unfocus', () => this.focusedButton = null);
    });
    //
    this.menu.style.display = 'block';
    // position menu *above* cursor
    const height = window.innerHeight;
    const top = this.quill.container.getBoundingClientRect().top;
    if (top > height / 2 && this.menu.offsetHeight > 0) {
      this.menu.style.top = '-' + this.menu.offsetHeight + 'px';
    }
    //
    this.buttons[0].classList.add('emoji-active');
  }

  handleDefaultEditorKeys(emoji) {
    if (event) {    // global window object
      if (event.key === 'Enter' || event.keyCode === 13) {
        console.log('  Enter (editor) -->', emoji.name)
        this.leaveCompMode(emoji, 1);                 // Note: "1" deletes inserted \n character
        // this.menu.style.display = 'none';          // already done by leaveCompMode()
        return true;
      } else if (event.key === 'Tab' || event.keyCode === 9) {
        console.log('  Tab (editor) --> move focus from editor to menu')
        this.quill.disable();                         // FIXME: delete inserted \t character
        this.buttons[0].classList.remove('emoji-active');
        this.buttons[1].focus();
        return true;
      }
    }
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
        this.leaveCompMode(emoji);
      }
    }
  }

  /**
   * Leaves completion mode (sets this.compMode to false), unregisters "text-change" and "selection-change" handlers.
   * Closes the menu. Inserts the emoji, if given.
   */
  leaveCompMode(emoji, trailingDelete = 0) {
    console.log('leaveCompMode', 'emoji', emoji?.name, 'trailingDelete', trailingDelete)
    this.quill.enable();
    this.menu.style.display = 'none';
    while (this.menu.firstChild) {
      this.menu.removeChild(this.menu.firstChild);
    }
    this.quill.off('selection-change', this.onSelectionChange);
    this.quill.off('text-change', this.onTextChange);
    //
    // insert emoji
    if (emoji) {
      const str = utils.emojiToString(emoji)      // Note: emoji can consist of more than one character
      this.quill.deleteText(this.colIndex, this.query.length + 1 + trailingDelete, Quill.sources.USER);
      this.quill.insertText(this.colIndex, str, Quill.sources.USER);
      setTimeout(() => this.quill.setSelection(this.colIndex + str.length), 0);
    }
    this.quill.focus();
    this.compMode = false;
    this.onClose && this.onClose(emoji);
  }

  /**
   * Quill key handler for arrow-right and arrow-down.
   */
  handleArrow() {
    console.log('handleArrow (editor)', 'compMode', this.compMode)
    if (!this.compMode) {
      return true;
    }
    this.buttons[0].classList.remove('emoji-active');
    this.buttons[0].focus();
    if (this.buttons.length > 1) {
      this.buttons[1].focus();
    }
  }

  /**
   * "selection-change" handler invoked during completion mode ("this" is the module instance).
   */
  maybeUnfocus() {
    if (this.menu.querySelector('*:focus')) {
      console.log('maybeUnfocus (menu has focus) --> abort')
      return;
    }
    console.log('maybeUnfocus (menu does not have focus) --> leave completion mode')
    this.leaveCompMode();
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
