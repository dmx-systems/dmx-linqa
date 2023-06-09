package systems.dmx.linqa;



public class Constants {

    public static final String ZW_PLUGIN_URI            = "systems.dmx.linqa";
    public static final String TEAM_WORKSPACE_URI       = "linqa.team";
    public static final String TEAM_WORKSPACE_NAME      = "Team";

    // Topic Types
    public static final String DOCUMENT                 = "linqa.document";
    public static final String DOCUMENT_NAME            = "linqa.document_name";
    public static final String ZW_NOTE                  = "linqa.note"; // "NOTE" is already used by Notes module
    public static final String TEXTBLOCK                = "linqa.textblock";
    public static final String HEADING                  = "linqa.heading";
    public static final String ARROW                    = "linqa.arrow";
    public static final String COMMENT                  = "linqa.comment";
    public static final String COMMENT_LANG1            = "linqa.comment.lang1";
    public static final String COMMENT_LANG2            = "linqa.comment.lang2";
    public static final String LANGUAGE                 = "linqa.language";
    public static final String TRANSLATION_EDITED       = "linqa.translation_edited";
    public static final String LOCKED                   = "linqa.locked";
    public static final String VIEWPORT                 = "linqa.viewport";
    public static final String EDITOR                   = "linqa.editor";
    public static final String EDITOR_FACET             = "linqa.editor_facet";
    public static final String SHOW_EMAIL_ADDRESS       = "linqa.show_email_address";
    public static final String SHOW_EMAIL_ADDRESS_FACET = "linqa.show_email_address_facet";

    // Assoc Types
    public static final String SHARED_WORKSPACE         = "linqa.shared_workspace";
    public static final String ATTACHMENT               = "linqa.attachment";
    public static final String ORIGINAL_LANGUAGE        = "linqa.original_language";
    public static final String LANG1                    = "linqa.lang1";
    public static final String LANG2                    = "linqa.lang2";

    // DB Props
    public static final String ZW_COLOR    = "linqa.color";  // Note, Textblock (String)
        // Note: COLOR is already used by Webclient module, but as type URI; here we have a prop URI
    public static final String ANGLE       = "linqa.angle";  // Document, Note, Textblock, Heading, Arrow (Integer)
    public static final String USER_ACTIVE = "linqa.user_active";   // Username (Boolean)
}
