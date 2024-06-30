<template>
  <router-view></router-view>
</template>

<style>
@import url(../../resources-build/ubuntu-font/fonts.css);

:root {
  /*
    Note 1: we no longer use the platform's system font (font-family: system-ui) as Chrome on a Mac renders some emojis
      (e.g. U+263A White Smiling Face, U+2708 Airplane) as small black glyphs then while Firefox and Safari render all
      emojis nicely and in color. The origin is that the macOS system font ("SF Pro"), while being a text font, it also
      contains small black glyphs for some emoji code points and these compete with the dedicated "Apple Color Emoji"
      font. When SF Pro is selected Chrome renders all characters with this font and falls back to "Apple Color Emoji"
      only for glyphs not found in SF Pro. Firefox (as well as Safari) on the other hand always use the "Apple Color
      Emoji" font for rendering emoji characters.
        https://fullystacked.net/using-emoji-on-the-web/
        https://nolanlawson.com/2022/04/08/the-struggle-of-using-native-emoji-on-the-web/
      To have colorful emoji rendering in all browsers the solution is utilizing a font for primary text rendering which
      does not contain any emoji glphys, e.g. the "Ubuntu" web font.

    Note 2: multiple-word font names like "Apple Color Emoji" are not quoted.
    In various browsers DOM style.getPropertyValue() works differently (see https://jsfiddle.net/jri_/tt8o97yu/2/):
      Safari: converts " -> '
      Chrome: converts ' -> "
      Firefox: no conversion
    This affects at least 2 situations:
      1) When styling Cytoscape nodes/edges (style: {'font-family': ...}) Cytoscape expects " to be used when quoting
         multiple-word font names. Otherwise an error is reported along with stacktrace (but rendering works anyways).
      2) When rendering a SVG <text> element the font-family attribute value must be enclosed in the opposite quoting
         style (e.g. <text font-family='"Lucida Grande", sans-serif'>). Otherwise the SVG would be malformed.
    So, the different style.getPropertyValue() browser behavior creates quite a mess.
    All the mess vanish if multiple-word font names are not quoted at all in CSS. There are some debates whether this
    is valid CSS or not. Fact is multiple-word font names without quotes do work in all major browsers.
  */
  --primary-font-family: Ubuntu, Twemoji Country Flags, Twemoji Mozilla, Apple Color Emoji, Segoe UI Emoji,
      Segoe UI Symbol, Noto Color Emoji, EmojiOne Color, Android Emoji, sans-serif;
  --primary-font-size: 14px;
  --secondary-font-size: 13px;
  --secondary-color: #808080;
  --line-height: 1.5;
  --paragraph-spacing: 10px;
  --field-spacing: 16px;                      /* vertical spacing between data fields */
  --button-spacing: 14px;                     /* horizontal spacing between toolbar buttons */

  --header-color: black;
  --background-color: #e6e6e6;                /* used for panels and forms */
  --primary-color: #ffd100;                   /* used for doc-filter, comment-refs, login/legal pages (yellow) */
  --primary-color-light: #fff6cc;             /* used for doc-filter, comment-refs, login/legal pages (light yellow) */
  --highlight-color: #409eff;                 /* matches Element UI --color-primary (blue) */
  --highlight-color-2: #66b1ff;               /* matches Element UI --color-primary-light-2 */
  --highlight-color-9: #ecf5ff;               /* matches Element UI --color-primary-light-9 */
  --color-danger: #f56c6c;                    /* matches Element UI --color-danger */
  --border-color: #dcdfe6;                    /* matches Element UI --border-color-base */
  --border-color-lighter: #ebeef5;            /* matches Element UI --border-color-lighter */
  --menu-item-color: #606266;                 /* matches Element UI .el-dropdown-menu__item color */
  --filter-border: 6px solid transparent;
  --glow-duration: 3s;                        /* corresponds to jumpTo() in lq-discussion.vue */
}

html {
  height: 100%;
}

body {
  height: 100%;
  margin: 0;
  overflow: hidden;     /* never show body scrollbar caused by e.g. discussion panel */
  /* overflow-wrap: break-word; */
  font-family: var(--primary-font-family);
  font-size: var(--primary-font-size);
}

body.fixed {
  position: fixed;
}

/* Reusable classes */

.secondary {
  color: var(--secondary-color);
}

.label {
  font-size: var(--secondary-font-size) !important;
  color: var(--secondary-color) !important;
}

.field-label {
  font-size: var(--secondary-font-size) !important;
  color: var(--secondary-color) !important;
  margin-bottom: 3px !important;
}

.field + .field {
  margin-top: var(--field-spacing);
}

.match {
  border: 2px solid red;
}

.edited-indicator {
  display: inline-block;
  visibility: hidden;
  margin-top: 3px;
  padding: 2px 8px;
  font-size: var(--secondary-font-size);
  color: var(--secondary-color);
  background-color: var(--primary-color-light);
}

.edited-indicator.edited {
  visibility: visible;
}

/* User Agent Stylesheet Overrides */

input, button {
  font-family: unset;     /* Firefox (Mac) default is "-apple-system", Chrome (Mac) default is "Arial" */
}

/* Element UI Overrides */
.el-button--text {
  padding: 0 !important;
}

.el-loading-mask {
  background-color: rgba(255, 255, 255, .7) !important;       /* Element UI default alpha is 0.9 */
}

.el-message-box {
  max-width: 96vw;        /* restrict width on mobile, Element UI default width is 420px */
}

.el-message-box .el-message-box__title {
  line-height: 1.4;       /* Element UI default is 1 */
}

.el-message-box .el-message-box__message p {
  line-height: 1.4;       /* Element UI default is 24px */
}

.el-notification__content {
  text-align: unset !important;
}

.el-notification__content p {
  margin-top: 1em !important;
}

.el-collapse-item__header,
.el-collapse-item__content {
  font-size: unset !important;
}

.el-collapse-item.lq-selected .el-collapse-item__wrap,
.el-collapse-item.lq-selected .el-collapse-item__header {
  background-color: var(--highlight-color-9);
}

/* HTML fields */

.dmx-html-field {
  line-height: var(--line-height);
}

.dmx-html-field p {
  margin: 0;
}

.dmx-html-field p + p,
.dmx-html-field p + table {
  margin-top: var(--paragraph-spacing);
}

.dmx-html-field img {
  max-width: 100%;
}

.dmx-html-field a {
  color: var(--highlight-color);
}

.dmx-html-field a:hover {
  color: var(--highlight-color-2);
}

/* Adopt Quill list style in info mode */

.dmx-html-field.info ol > li,
.dmx-html-field.info ul > li {
  list-style-type: none;
}

.dmx-html-field.info ul > li::before {
  content: '\2022';
}

.dmx-html-field.info li::before {
  display: inline-block;
  white-space: nowrap;
  width: 1.2em;
  margin-left: -1.5em;
  margin-right: 0.3em;
  text-align: right;
}

.dmx-html-field.info li.ql-indent-1 { padding-left:  3em; }
.dmx-html-field.info li.ql-indent-2 { padding-left:  6em; }
.dmx-html-field.info li.ql-indent-3 { padding-left:  9em; }
.dmx-html-field.info li.ql-indent-4 { padding-left: 12em; }
.dmx-html-field.info li.ql-indent-5 { padding-left: 15em; }
.dmx-html-field.info li.ql-indent-6 { padding-left: 18em; }

.dmx-html-field.info ol li             { counter-increment: list-0; counter-reset: list-1; }
.dmx-html-field.info ol li.ql-indent-1 { counter-increment: list-1; counter-reset: list-2; }
.dmx-html-field.info ol li.ql-indent-2 { counter-increment: list-2; counter-reset: list-3; }
.dmx-html-field.info ol li.ql-indent-3 { counter-increment: list-3; counter-reset: list-4; }
.dmx-html-field.info ol li.ql-indent-4 { counter-increment: list-4; counter-reset: list-5; }
.dmx-html-field.info ol li.ql-indent-5 { counter-increment: list-5; counter-reset: list-6; }

.dmx-html-field.info ol li:before             { content: counter(list-0, decimal)     '.'; }
.dmx-html-field.info ol li.ql-indent-1:before { content: counter(list-1, lower-alpha) '.'; }
.dmx-html-field.info ol li.ql-indent-2:before { content: counter(list-2, lower-roman) '.'; }
.dmx-html-field.info ol li.ql-indent-3:before { content: counter(list-3, decimal)     '.'; }
.dmx-html-field.info ol li.ql-indent-4:before { content: counter(list-4, lower-alpha) '.'; }
.dmx-html-field.info ol li.ql-indent-5:before { content: counter(list-5, lower-roman) '.'; }

/* Quill Overrides */

.ql-container {
  font-family: var(--primary-font-family) !important;     /* Quill default is "Helvetica, Arial, sans-serif" */
  font-size:   var(--primary-font-size)   !important;     /* Quill default is 13px */
}

.ql-container .ql-editor {
  line-height: inherit !important;                        /* Quill default is 1.42; inherit from dmx-html-field */
  padding: 6px 8px !important;                            /* Quill default is 12px 15px */
  background-color: white;
}

.ql-container .ql-editor.ql-blank::before {
  color: rgba(0, 0, 0, 0.4);                              /* Quill default is rgba(0, 0, 0, 0.6) */
}

.ql-container .ql-editor h1 {
  margin-top: 0.67em;                                     /* Restore user agent style; Quill default is 0 */
  margin-bottom: 0.67em;                                  /* Restore user agent style; Quill default is 0 */
}

.ql-container .ql-editor h2 {
  margin-top: 0.83em;                                     /* Restore user agent style; Quill default is 0 */
  margin-bottom: 0.83em;                                  /* Restore user agent style; Quill default is 0 */
}

.ql-container .ql-editor h3 {
  margin-top: 1em;                                        /* Restore user agent style; Quill default is 0 */
  margin-bottom: 1em;                                     /* Restore user agent style; Quill default is 0 */
}

.ql-container .ql-editor ol,
.ql-container .ql-editor ul {
  margin-top: 1em;                                        /* Restore user agent style; Quill default is 0 */
  margin-bottom: 1em;                                     /* Restore user agent style; Quill default is 0 */
}

.ql-container .ql-tooltip {
  width: 384px;         /* fixed toolbar width */
  z-index: 2;           /* stack toolbar above adjacent detail panel fields and el-checkboxes (z-index 1) */
}

.ql-container .ql-toolbar .ql-color-picker .ql-picker-options {
  width: 170px;         /* was 152px, we need room for another color option */
}

/* Quill-Mention Overrides */

.ql-mention-list-container {
  max-height: calc(100vh - 48px);
}

.ql-mention-list-item {
  font-size: var(--primary-font-size) !important;         /* quill-mention sets 16px */
  color: var(--menu-item-color);      /* quill-mention does not set any color, so it's black */
  line-height: 30px !important;       /* 30px matches .el-dropdown-menu__item medium size, quill-mention sets 44px */
}

.ql-mention-list-item.selected {
  background-color: var(--highlight-color-9) !important;  /* quill-mention sets #d3e1eb */
  color: var(--highlight-color-2);    /* quill-mention does not set any color, so it's black */
}

.mention {
  background-color: var(--highlight-color-9) !important;  /* quill-mention sets #d3e1eb */
  color: var(--highlight-color);      /* quill-mention does not set any color, so it's black */
}
</style>
