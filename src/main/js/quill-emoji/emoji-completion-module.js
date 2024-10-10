import Quill from 'quill';
import Fuse from 'fuse.js';
import emojiData from './emoji-data.js';
import utils from './emoji-utils.js';

const Module = Quill.import('core/module');

const LOG = false
const MAX_MENU_ITEMS = 10
const DEFAULT_MENU_ITEMS = [
  'grinning', 'grin', 'joy', 'rolling_on_the_floor_laughing', 'smiley',
  'smile', 'sweat_smile', 'laughing', 'wink', 'blush'
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
    this.emojiData = options.emojiData;
    this.fuse      = new Fuse(options.emojiData, options.fuse);
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
    this.quillKeyBindings()
  }

  quillKeyBindings() {
    // Colon keyCodes
    //
    // keyboard    de            us            fr
    //
    // Firefox     190/shift     59/shift      58
    //
    // Safari      186/shift     186/shift     186
    //             same as Ö!
    //
    // Chrome      186/shift     186/shift     186
    //             same as Ö!
    this.quill.keyboard.addBinding({key: 186, shiftKey: null},  this.enterCompletionMode.bind(this));
    this.quill.keyboard.addBinding({key: 190, shiftKey: true},  this.enterCompletionMode.bind(this));
    this.quill.keyboard.addBinding({key: 59,  shiftKey: true},  this.enterCompletionMode.bind(this));
    this.quill.keyboard.addBinding({key: 58,  shiftKey: false}, this.enterCompletionMode.bind(this));
    //
    this.quill.keyboard.addBinding({key: 39, collapsed: true}, this.handleArrow.bind(this));    // ArrowRight
    this.quill.keyboard.addBinding({key: 40, collapsed: true}, this.handleArrow.bind(this));    // ArrowDown
    //
    this.quill.keyboard.addBinding({key: 27}, this.handleEscape.bind(this));                    // Escape
    // TODO: add keybindings for Enter (13) and Tab (9) statically in Quill configuration.
    // Note: dynmic binding (via quill.keyboard.addBinding()) does not work for these keys as Quill provides
    // default handlers which can only be overridden by Quill configuration.
    // But how to dispatch into the module from a statically configured key handler?
  }

  /**
   * Quill key handler invoked by colon key.
   * Enters completion mode (sets this.compMode to true), registers "text-change" and "selection-change" handlers.
   * Calculates menu position and opens it.
   */
  enterCompletionMode(range, context) {
    LOG && console.log('### enterCompletionMode', 'key', `"${event.key}"`, 'compMode', this.compMode, 'index',
      range.index)
    if (event.key !== ':') {
      LOG && console.log('  --> abort, not colon key')
      return true;    // true triggers default Quill handler to insert typed character
    }
    if (this.compMode) {
      LOG && console.log('  --> abort, already in completion mode')
      return true;    // true triggers default Quill handler to insert colon
    }
    this.compMode = true;
    this.colIndex = range.index;
    //
    // insert colon
    if (range.length > 0) {
      this.quill.deleteText(range.index, range.length, Quill.sources.USER);   // delete selected text, replaced by colon
    }
    this.quill.insertText(range.index, ':', Quill.sources.USER);              // insert colon
    this.quill.setSelection(range.index + 1, Quill.sources.SILENT);           // advance cursor to *after* colon
    //
    // calculate menu position
    const bounds = this.quill.getBounds(range.index);
    let paletteMaxPos = bounds.left + 250;
    if (paletteMaxPos > this.quill.container.offsetWidth) {
      this.menu.style.left = `${bounds.left - 250}px`;
    } else {
      this.menu.style.left = `${bounds.left}px`;
    }
    this.menu.style.top = `${bounds.top + bounds.height}px`;
    //
    // register Quill event handlers
    this.quill.on('text-change', this.onTextChange);
    this.quill.once('selection-change', this.onSelectionChange);
    //
    this.onOpen?.();
    this.renderMenu(DEFAULT_MENU_ITEMS);
  }

  /**
   * "text-change" handler invoked during completion mode ("this" is the module instance).
   * Filters emojis by current "query" and updates the menu accordingly.
   */
  updateCompletions() {
    const index = this.quill.getSelection().index;
    LOG && console.log('  updateCompletions', 'colIndex', this.colIndex, 'index', index, this.quill.getText().split(),
      this.quill.getText().length)
    if (this.handleDefaultEditorKeys()) {
      return
    }
    if (this.colIndex >= index) {       // Deleted the at character
      LOG && console.log('    --> abort', this.colIndex, index)
      this.leaveCompletionMode();
      return;
    }
    //
    // calculate "query"
    this.query = this.quill.getText(this.colIndex + 1, index - this.colIndex - 1);
    LOG && console.log('    query', `"${this.query}"`, 'len', this.query.length, 'whitespace', /\s/.test(this.query))
    if (/\s/.test(this.query)) {        // typing whitespace leaves completion mode
      this.leaveCompletionMode();
      return;
    }
    //
    // search emojis (using fuse.js)
    let emojis = this.fuse.search(this.query).sort((a, b) => a.emoji_order - b.emoji_order);
    if (this.query.length < this.options.fuse.minMatchCharLength || emojis.length === 0) {
      LOG && console.log('    --> no result')
      this.menu.style.display = 'none';    // close menu w/o leaving completion mode
      return;
    }
    if (emojis.length > MAX_MENU_ITEMS) {
      emojis = emojis.slice(0, MAX_MENU_ITEMS);
    }
    this.renderMenu(emojis);
  }

  renderMenu(emojis) {
    LOG && console.log('    renderMenu', 'items', emojis.length)
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
      this.buttons[i].addEventListener('mousedown', () => this.leaveCompletionMode(emoji));
      this.buttons[i].addEventListener('focus', () => this.focusedButton = i);
      this.buttons[i].addEventListener('unfocus', () => this.focusedButton = null);
    });
    //
    this.menu.style.display = 'block';
    // change menu position to *above* cursor
    const height = window.innerHeight;
    const top = this.quill.container.getBoundingClientRect().top;
    if (top > height / 2 && this.menu.offsetHeight > 0) {
      this.menu.style.top = '-' + this.menu.offsetHeight + 'px';
    }
    //
    this.buttons[0].classList.add('emoji-active');
  }

  /**
   * Handles Enter/Tab keys when the *editor* has focus (not the *menu*).
   * "Enter" inserts the *first* emoji from the menu to Quill content.
   * "Tab" changes the focus to the menu and advances to the 2nd emoji.
   * Note: the Enter/Tab characters land in Quill content and need to be deleted.
   *
   * @return  true if the recent event was Enter/Tab key (which is now handled), false otherwise.
   */
  handleDefaultEditorKeys() {
    const deleteChar = () => {
      // Note: in a Quill text-change handler the selection not yet reflects the change, so index has not yet advanced
      // Note: we use SILENT to not emit another text-change event
      const index = this.quill.getSelection().index
      this.quill.deleteText(index, 1, Quill.sources.SILENT);
    }
    // "event" is global window object
    if (event.key === 'Enter') {
      LOG && console.log('    Enter (editor) -->', this.firstEmoji.name)
      deleteChar()
      this.leaveCompletionMode(this.firstEmoji);
      return true;
    } else if (event.key === 'Tab') {
      LOG && console.log('    Tab (editor) --> move focus from editor to menu')
      deleteChar()
      this.quill.disable();
      this.buttons[0].classList.remove('emoji-active');
      this.buttons[1].focus();
      return true;
    }
  }

  createMenuKeyHandler(i, emoji) {
    return event => {
      const buttons = this.buttons
      if (event.key === 'Tab') {
        event.preventDefault();
        if ((i + 1) === buttons.length) {
          buttons[0].focus();
          return;
        }
        buttons[Math.min(buttons.length - 1, i + 1)].focus();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        buttons[Math.min(buttons.length - 1, i + 1)].focus();
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        buttons[Math.min(buttons.length - 1, i + 1)].focus();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        buttons[Math.max(0, i - 1)].focus();
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        buttons[Math.max(0, i - 1)].focus();
      } else if (event.key === 'Enter' || event.key === ' ') {
        LOG && console.log('    Enter/Space -->', emoji.name)
        event.preventDefault();
        this.leaveCompletionMode(emoji);
      } else if (event.key === 'Escape') {
        LOG && console.log('    Escape --> abort')
        this.leaveCompletionMode();
      }
    }
  }

  /**
   * Leaves completion mode (sets this.compMode to false), unregisters "text-change" and "selection-change" handlers.
   * Closes the menu. Inserts the emoji, if given.
   */
  leaveCompletionMode(emoji) {
    LOG && console.log('### leaveCompletionMode', 'emoji', emoji?.name, 'length',
      emoji && utils.emojiToString(emoji).length)
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
      this.quill.deleteText(this.colIndex, this.query.length + 1, Quill.sources.USER);
      this.quill.insertText(this.colIndex, str, Quill.sources.USER);
      setTimeout(() => this.quill.setSelection(this.colIndex + str.length), 0);
    }
    this.quill.focus();
    this.compMode = false;
    this.onClose?.(emoji);
  }

  /**
   * Quill key handler for arrow-right and arrow-down.
   */
  handleArrow() {
    LOG && console.log('  handleArrow (editor)', 'compMode', this.compMode)
    if (!this.compMode) {
      return true;
    }
    this.buttons[0].classList.remove('emoji-active');
    this.buttons[0].focus();
    if (this.buttons.length > 1) {
      this.buttons[1].focus();
    }
  }

  handleEscape() {
    LOG && console.log('handleEscape (editor)', 'compMode', this.compMode)
    if (!this.compMode) {
      return true;
    }
    this.leaveCompletionMode()
  }

  /**
   * "selection-change" handler invoked during completion mode ("this" is the module instance).
   */
  maybeUnfocus() {
    if (this.menu.querySelector('*:focus')) {
      LOG && console.log('  maybeUnfocus (menu has focus) --> abort')
      return;
    }
    LOG && console.log('  maybeUnfocus (menu does not have focus) --> leave completion mode')
    this.leaveCompletionMode();
  }
}

EmojiCompletionModule.DEFAULTS = {
  emojiData: emojiData,
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
