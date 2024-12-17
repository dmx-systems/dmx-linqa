# DMX Linqa

Linqa is a platform for bilingual collaboration. Linqa provides shared workspaces for handling and commenting
on various kinds of content objects (documents, notes, textblocks). Content objects are freely placed on a workspace "canvas", and can be further decorated by headings and graphical elements. Every user input is automatically translated on-the-fly by the means of the [DeepL](https://www.deepl.com) service.

The canvas is synchronized between collaborating users. There are 3 user roles: *administrators* (create workspaces and user accounts, manage memberships and user roles), *editors* (edit content objects and arrange the canvas), and *users* (browsing canvas content).

The pair of languages Linqa uses for automatic translation and for the UI is configurable per installation. At the moment 9 languages are supported:

| Code | Language               |
| ---- | ---------------------- |
| `de` | German                 |
| `en` | English                |
| `es` | Spanish                |
| `fi` | Finnish                |
| `fr` | French                 |
| `pl` | Polish                 |
| `pt` | Portuguese (Brazilian) |
| `sv` | Swedish                |
| `uk` | Ukrainian              |

Linqa is an application for the [DMX platform](https://github.com/dmx-systems/dmx-platform). Linqa is Open Source software under the GNU AGPL license. Linqa is the generalized version and subsequent derivate of the [DMX Zukunftswerk](https://github.com/dmx-systems/dmx-zukunftswerk) customer project.

Issue tracker: https://git.dmx.systems/dmx-plugins/dmx-linqa/-/issues

## Installation

TBD

## Configuration

For Linqa to work it is mandatory to configure 2 languages and a DeepL API key. To do so add entries to DMX's `conf/config.properties` file. After editing the config file restarting the DMX platform is required.

| Property           | Required | Description                                               |
| --------           | -------- | -----------                                               |
| dmx.linqa.lang1    | yes      | ISO 639-1 language code, see table above. |
| dmx.linqa.lang2    | yes      | ISO 639-1 language code, see table above. |
| dmx.linqa.digest_email_subject | no | The string appearing in the subject of the digest emails sent by Linqa.<br>Default is `Linqa Platform`. |
| dmx.deepl.auth_key | yes      | Your DeepL API key as obtained from https://www.deepl.com |
| dmx.deepl.base_url | no       | DeepL API base URL. Includes version number, ends with `/`.<br>Default is `https://api-free.deepl.com/v2/`.<br>For the DeepL payed plan use `https://api.deepl.com/v2/` instead. |

All following configuration possibilities (Site logo, legal texts, ...) rely on file/directory naming conventions. In these cases restarting the DMX platform is *not* required.

### Site logo

You can provide a custom logo for your specific Linqa installation. If you don't provide a custom logo Linqa will show its default logo:

![linqa-logo.png](docs/linqa-logo.png)

The Linqa UI shows the logo at 3 dedicated spots:

- The Login page
- The legal pages (Imprint and Privacy Policy)
- The top header of the main Linqa UI

The logo is language sensitive. In an e.g. German/French Linqa installation you could have 2 individual logos:

![zw-logo.de.png](docs/zw-logo.de.png)
![zw-logo.fr.png](docs/zw-logo.fr.png)

The Linqa UI would then show the logo corresponding to the language currently selected by the user.

For each language you need to create a separate PNG file with name `logo` and put them in DMX's `conf/dmx-linqa/` directory:

```
logo.de.png
logo.en.png
logo.es.png
...
```

It is sufficient to provide the logo files for the languages configured for `lang1` and `lang2` respectively. If the logo file for the current UI language is missing Linqa will show its default logo. Note: if you want the *same* custom logo appear regardless of selected UI language you still need provide separate files then (just copies).

The logo files are expected to be PNGs. Other file types are not supported at the moment.

The logo PNGs should have an height of at least 84px. The width is arbitrary. Note: the respective language versions are *not* required to have the same width.

#### Logo style

Linqa's default stlyesheet will resize the logos to a height of 84px (Login and legal pages) resp. 44px (app header). To change this style or to add further style properties to your logo see *Custom CSS* below.

### Imprint and privacy policy

It is required to configure site-specific imprint and privacy policy texts.

To do so create a `dmx-linqa/` directory within your DMX `conf/` directory with this content:
```
imprint.de.html
imprint.en.html
imprint.es.html
...
privacy_policy.de.html
privacy_policy.en.html
privacy_policy.es.html
...
```

These files are supposed to contain HTML *fragments*, that is one or more `<p>`, `<h2>`, `<ul>`, ... elements. *No* `<html>` or `<body>` element.

It is sufficient to provide the language files as configured for `lang1` and `lang2` respectively.

### Email texts

TBD

#### Welcome email
#### New password email
#### Digest email
##### Digest email style

### Help texts

TBD

### Custom CSS

You can override/extend Linqa's default CSS styles by providing a custom stylesheet. To do so put a file named `custom.css` to DMX's `conf/dmx-linqa/` directory. This stylesheet will be loaded *after* Linqa's default style, thus allowing easy overriding the default rules.

Use the browser's inspector tool to investigate the Linqa markup and define your custom rules accordingly. Practically all Linqa page elements are equipped with class attributes, making them easily accessible for customization. The major elements use the `lq-` class prefix.

Examples:

```
.lq-login, .lq-app-header {
  background-color: white;      /* make Login page and main UI's header white instead of black */
}

.lq-login img.logo {
  filter: invert(100%);         /* apply a filter to Login page's logo */
  margin-left: -81px;           /* outdent Login page's logo */
}
```

Note: if you run Linqa in development mode (via webpack-dev-server) stylesheet loading order is different. In order to see effect while development you might need to add `!important` to your custom rules.

### Serving custom resources

Basically Linqa makes all files residing in DMX's `conf/dmx-linqa/` directory available to the web browser. So you can supply further resource files for your own purposes here. Resource files can be multilingual (individual files per language) or language independent.

In order to access your resource files use this URL format (e.g. inside your custom CSS):

```
/linqa/config/{file name}/{file type}
```

For multilingual resource files append a query parameter:

```
/linqa/config/{file name}/{file type}?multilingual=true
```

For example, to display a decorative image (`zw-snake.png`) on both, the Login and the legal pages:

1. Put the file `zw-snake.png` into DMX's `conf/dmx-linqa/` directory, and
2. Supply some custom CSS (see above):
   ```
   .lq-login, .lq-legal {
     background-image: url("/linqa/config/zw-snake/png");
     background-position: bottom right;
     background-repeat: no-repeat;
   }
   ```

Note: in the URL it's `.../zw-snake/png`, not `.png`. As explained above this URL will access the corresponding `.png` file then.

In case you want display a language specific image you'd have to 1) supply one file per language, and 2) use this URL: `.../zw-snake/png?multilingual=true`. This accesses the image corresponding to the selected UI language then:

```
conf/dmx-linqa/zw-snake.de.png
conf/dmx-linqa/zw-snake.en.png
conf/dmx-linqa/zw-snake.es.png
...
```

While the custom logo is limited to `PNG` files, for the custom resources you can use arbitrary file types.

## Version History

**2.0** -- unreleased

* Features:
    * UI adapted for mobile touch devices
    * Reactions:
        * Users can add emoji-reactions to content objects e.g. thumb up/down
        * Reactions are counted per-user, allowing quick votes
    * Mentions:
        * In comments and content objects users can @mention other users
        * Typing `@` brings up a menu showing all users of the current workspace, plus `all` option
        * In her user profile one can set the notification level to control what to include in the daily notification mails
    * In-editor emoji support
        * Typing `:` brings up an emoji-menu allowing to filter emojis by name (continuing typing)
        * An in-editor emoji-button brings up a visual palette offering all available emojis, grouped by category
    * New decorative canvas object types:
        * Shapes (rectangles, ellipses, outlines)
        * Lines (solid, dotted, dashed)
        * Arrows (single or double headed)
    * New command for canvas objects: Duplicate, Multi-duplicate
    * Admin Area: new command Duplicate-Workspace
    * Presentation mode: temporarily hide all editing functions
    * Menus for canvas object direct manipulation (color, shape, line style, arrow heads)
        * When rotating an object the toolbar flips to not appear upside down
    * Alternative "Track Point"-like canvas panning mechanism
    * New info-menu in app header:
        * In-app help texts with screenshots, opens automatically on 1st login
        * Also in-app texts About Linqa, Impressum, and Privacy Statement
* Improvements:
    * Improved notification emails:
        * Now HTML (formerly plain text), styled with CSS, images inside comments are included
        * Customizable style and header/footer text via resources
        * Configurable mail subject and time schedule for sending
    * Performance improvements (loading workspaces)
        * Start loading videos only when Play is pressed, before a poster frame is shown
        * Quill editor: handle images as separate resources (instead of embedding as data-URL)
        * Scale down uploaded images
    * New text editor styles: text color, strike through
    * Discussion panel: initial panel size is smaller
        * Size set by user is remembered
    * Read-only users can pan canvas everywhere
    * Show canvas object commands as icons (instead labels)
        * Commands do not line wrap
    * Multi-lock/unlock for canvas objects
        * Lock function is also effective for Linqa admins
    * Manual vertical resize for notes and textblocks
        * Auto-height is still supported
    * Textblocks: make both texts equal width
    * Documents: uploaded office documents are shown with their icon and file name (.doc, .xls, .ppt, Libre Office)
    * 3 revised color palettes: foreground, background, text marker
    * Support for one additional language (now 9): Polish
    * Configurability:
        * Help resources (HTML, CSS, images)
        * Password related mail texts are configurable through resources
    * Check password complexity, display password requirements
* Continuous integration:
    * Automatic tests for both Java and Javascript
    * Measure test coverage
* Chore:
    * Update front end libraries: Quill 2, Vue 3, Element Plus, PDF.js 3
    * Update build system: Webpack 5, Babel 7
* Compatible with DMX 5.3.5-SNAPSHOT and DMX Sign-Up 3.3-SNAPSHOT

**1.7.1** -- Feb 23, 2024

* Fixes:
    * Render color emojis in all browsers and platforms
    * Discussion panel: redering of comments-refs, doc-refs, and textblock-refs
* Changes:
    * On all platforms the Linqa UI utilizes the "Ubuntu" web font
* Compatible with DMX 5.3.4

**1.7** -- Dec 15, 2023

* Features:
    * A welcome-mail is sent to new users automatically
        * The welcome-mail is in the language selected by admin when creating the account
        * That language is also used as user's initial UI language
        * The welcome-mail contains a link to the password-reset dialog, prefilled with user's email address
    * Support for non-Latin languages (app-strings .properties files are accepted as UTF-8)
    * 2 additional languages: Ukrainian, Portuguese (Brazilian)
* Improvements:
    * Reset-password is integrated in Linqa UI (instead utilizing separate DMX Sign-up UI)
        * Password-reset dialog is URL addressable
        * New (URL addressable) new-password dialog
        * Linqa now depends on Sign-up 3.0 (formerly Sign-up 2.1)
    * Workspace "Team" is renamed to "Linqa Administration"
* Fixes:
    * Password-reset mail is plain text (instead multipart with broken plain text part)
    * Newly created document renders properly also if document name is auto-translated
    * Newly created workspace has name
    * Bilingual workspace names are rendered properly
    * Workspace form shows proper field labels
    * Alert box "User not yet assigned to any workspace" is translated
    * Wording: final "ZW" occurrences are replaced by "Linqa" e.g. in digest email subject
* Compatible with DMX 5.3.3

**1.6** -- Sep 1, 2023

* Features:
    * **Configurability**: a Linqa installation can adapt to various usage scenarios:
        * the 2 languages used for a) automatic content translation, b) the UI itself
        * the logo appearing for app header/login and legal pages, multilingual
        * legal texts: imprint and privacy policy, multilingual
        * CSS style (colors, fonts, decorative images, ...)
    * **Text blocks**: a new type of content object that shows both languages at the same time, colorizable, commentable, used for collaborative bilingual text creation
    * **Canvas search**: user can search content on current canvas, search results are highlighted in-place, when browsing search results the canvas auto-pans to respective object (animated)
    * **Multi-selection**: users can select multiple objects at once, editors can multi-move and multi-delete
    * **Text highlighting**: editors can highlight text, 7 colors available, available for notes, text blocks, and comments
    * **Snap-to-grid**: when moving content objects they snap to a 20px grid, rotation takes place in 5° steps
    * **Object locking**: administrators can lock objects to prevent unintended changes by editors
    * Admin area: in the user list an **"Active" checkmark** indicates whether the respective user has logged in at least once
    * 6 supported languages: German, English, Spanish, Finnish, French, Swedish
* Improvements:
    * Usability improvements:
        * All workspace lists are sorted alphabetically (in both, user area and admin area), and are resorted when the UI language is switched
        * All bilingual text forms: a "translation modified" indicator is shown when automatic translation was modified manually, to prevent unintended overriding when redoing an automatic translation
        * Canvas: the object commands ("Edit", "Delete", ...) have bigger click area
        * Canvas: zoom-1:1 button is removed, it was not needed
        * All automatic panning/zooming operations are *animated*, e.g. home button, zoom-to-fit button
        * All buttons show tool tips when hovered
        * More consistent wording in UI elements
    * Rich text editor:
        * Removed 3 formats from toolbar: code, blockquote, and code-block, these were not needed
        * All toolbar buttons are placed in a single row (instead of 2 rows)
    * Login page:
        * Username/email address is handled case-insensitively
        * Login page shows no "beta" label anymore
    * Admin area: a workspace can be deleted by *all* team members (not only by workspace owner)
    * The DeepL API URL is configurable, so it works with both, the free, as well as the payed DeepL plan (improved in DeepL plugin)
    * Smaller DB size (improved in DMX platform: transaction log files are purged on a regular basis)
    * In case of a server/network loss an alert box is shown and the application is relaunched (improved in DMX platform)
* Fixes:
    * Text containing special characters (HTML's `>`, `&`, ...) is properly translated (fixed in DeepL plugin)
    * All bilingual text forms: after pressing "translate" the translation state switches back to "automatic"
    * New workspaces are available immediately, page reload is not required
    * The workspace menu is now scrollable, in case there are a lot of workspaces
    * When switching to another workspace the canvas search is cleared
    * Downloading files (documents, comment attachments) always works on 1st attempt
    * Discussion panel: long attachment names are line-wrapped
    * Deleting a workspace (admin area) does not corrupt other workspaces (fixed in DMX platform)
    * Various view inconsistencies and layout oddities are fixed, particularly in the admin area
* Compatible with DMX 5.3

**1.5** -- Sep 5, 2022

* Improvements:
    * Auto-translate document name
    * Manual-translate button is always visible (documents, notes, headings, and comments)
    * PDFs remember selected page when fullscreen is switched on/off
    * Note and heading forms have a gray background
    * Image data-URLs are not send to the DeepL service (improved in DeepL plugin)
    * Discussion panel shows a spinner while loading
    * Admin area:
        * The respective workspace owners are displayed
        * Only the owner can delete a workspace
    * Send email digests: only one mail per day and workspace (at 6am)
* Fixes:
    * Working with multiple forms at the same time works
        * The selected form appears before other forms
    * New canvas items are selected programmatically
    * New document name is shown if entered afterwards
    * New viewport zoom value is respected immediately (when pressing the Home button)
    * When switching UI language the document resize-frame adapts
    * Document discussion button appears yellow when doc-filter is set
    * Change no-workspace error text ("Du" -> "Sie")
* Compatible with DMX 5.3-SNAPSHOT

**1.4** -- Aug 6, 2022

* Features:
    * New user profile dialog:
        * The user can edit her Display Name
        * The user controls whether to show her email address to other users by the means of a checkbox
        * The user can initiate a password-reset
    * Chat panel: show email-address of other users, if allowed by respective user
    * Canvas: documents can be downloaded
    * The Privacy policy text is now in place
* Improvements:
    * ZW UI language:
        * At first launch the browser's language setting is respected
        * The UI language chosen by the user is remembered
    * Canvas:
        * Item rotation is restricted to steps of 5 degrees, so resetting to 0 is easy
        * New "reset zoom" button sets the zoom back to "normal" (1)
    * Chat panel: scroll comment's OK/Cancel buttons into view when clicking Edit
    * Imprint/privacy policy: clicking the ZW logo returns to home page
    * Updated texts for the password-reset workflow
* Fixes:
    * Canvas:
        * Zoom-to-fit button works as expected
        * Editing of notes/headings when created w/o translation
        * Item selection works for participants (selected item appears on-top)
    * Chat panel:
        * Break long words in comments
        * Comments are properly rendered when logged in using uppercase in username
    * Admin area: workspace names in membership list reflect UI language
    * Images survive the auto-translation
    * Special characters in sent emails are properly encoded (both, HTML and plain text parts)
    * Client-sync:
        * Client sync for update-comment and delete-comment
        * Control box is updated when item moves
    * Redirect if user is logged in but the requested workspace is not readable
    * Missing translations are added
* Compatible with DMX 5.3-SNAPSHOT

**1.3** -- Jul 7, 2022

* Features:
    * 4 new canvas buttons: "Home", "Zoom to fit", "Zoom in", "Zoom out"
    * Rotatable canvas items: Notes, Documents, Headlines
* Improvements:
    * Login:
        * User lands in recently used workspace (based on ws-cookie)
        * Workspace deep-links: request login if due
    * Canvas / PDF viewer:
        * Larger "fullscreen" toggle button
    * Chat panel:
        * Accept only images and PDFs as comment attachments
        * Use "paper plane" icon for submit
* Fixes:
    * Canvas: arrows properly follow when moving handles
    * Chat panel:
        * Editors can't edit posts (only her own)
        * Reset doc-filter on workspace change
        * New-comment placeholder text adapts to UI language
    * Header: workspace drop down is up-to-date after WS edit
    * Admin area: disable "Editor" checkbox if "Member" is unchecked
* Compatible with DMX 5.3-SNAPSHOT

**1.2** -- Jun 4, 2022

* Features:
    * Client-sync for canvas items:
        * Notes, Documents, Arrows, Headings, Viewport Topic
        * Operations: Create, Move, Edit, Delete
* Improvements:
    * Auto-translation:
        * Untranslatable notes and headings can be saved anyways
        * Notes, headings, and comments can be auto-translated after creation
    * Canvas:
        * Add Note colors "white" and "transparent"
        * Draggable items show hand cursor
        * Arrows:
            * Arrows appear before other items (except selected items and forms)
            * Different mouse cursors for move-arrow vs. move-arrow-handle
        * Slightly more prominent grid in the background. The grid now zooms along with canvas.
    * Discussion panel: strip "video" button from text editor toolbar
* Fixes:
    * Login of users which are not Team members
    * Set initial viewport in zoomed topicmaps. "Persistent Viewport" feature is now complete.
    * Header: show workspace names in dropdown bilingually
    * Admin area:
        * User list shows workspace names bilingually
        * User area is up-to-date once workspace edited
    * PDF viewer works with Chinese characters
* Compatible with DMX 5.3-SNAPSHOT

**1.1** -- May 6, 2022

* Features:
    * Freely editable arrows
    * Admin area: Edit/Delete of Users/Workspace
    * Editor role (selected users can create/edit canvas content of selected workspaces)
    * Colored notes
    * Persistent viewport
* Improvements:
    * Clicking on canvas deselects
* Fixes:
    * In comment-refs show Display Name (not email address)
* Compatible with DMX 5.3-SNAPSHOT

**1.0.3** -- Apr 6, 2022

* Improvements:
    * Login page has a "beta" stamp
* Fixes (admin area):
    * Also the 2nd level of workspaces/users lists is sorted
    * Workspaces and Users areas are consistent after updates
    * Disable create-user button when user input is missing

**1.0.2** -- *rejected*

**1.0.1** -- Apr 4, 2022

* Improvements:
    * Show notification once password reset mail is sent

**1.0** -- Apr 4, 2022

* Features:
    * Admin area (for ZW team members)
        * Create users and workspaces
        * Manage memberships
    * Notification mails (team members are notified via email about new comments)
    * PDF read mode (the entire canvas is used)
* Improvements:
    * Login page (no public access anymore)
        * Password reset dialog
    * Users are pseudonymized via "Display Name" (email addresses are never shown)
    * Comments which are not auto-translatable can be stored anyways (and manually translated later on)
    * Comment auto-translation status is shown: "automatic"/"edited"/"none"
    * Workspace selector (in case the user has more than one workspace memberships)
    * "Imprint" & "Privacy Policy" shown on to Login page (linkable)
* Design:
    * ZW corporate style guide is applied (not yet complete)
* Fixes:
    * Only team members can move canvas items
* Compatible with DMX 5.3-SNAPSHOT

**0.9.1** -- Mar 1, 2022

* Fixes:
    * PDF viewer and language switch
    * Edit/Delete and non-team members
* Compatible with DMX 5.3-SNAPSHOT

**0.9** -- Mar 1, 2022

* Improvements:
    * UI-less PDF viewer
    * Discussion panel: chat metaphor
    * Reply works also when doc-filter is set
    * Canvas zooms around mouse position
    * Edit and Delete functions for all types (Notes, Documents, Comments, Headings)
    * All forms have a Cancel button
* Design:
    * Redesigned discussion panel
    * Doc-filter is more visible
    * Header shows ZW logo
* Compatible with DMX 5.3-SNAPSHOT

**0.8** -- Jan 15, 2022

* Data model: Notes, Documents, Comments, Headings, Arrows
* Basic UI: header, canvas, discussion panel, doc-filter
* Actions: create, reply, set doc-filter, pan, zoom, move item, resize item
* User roles: team member (authoring), participant (commenting)
* Client-sync: comments
* Compatible with DMX 5.3-SNAPSHOT
