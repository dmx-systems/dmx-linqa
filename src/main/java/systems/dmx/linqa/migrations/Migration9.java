package systems.dmx.linqa.migrations;

import static systems.dmx.core.Constants.*;
import static systems.dmx.files.Constants.*;
import static systems.dmx.linqa.Constants.*;

import systems.dmx.core.service.Migration;



/**
 * Creates "Locked" flag and adds it to "Document"/"Note"/"Textblock"/"Heading"/"Arrow".
 * Changes "Arrow" data type "Text" -> "Entity".
 * <p>
 * Part of Linqa 1.6
 * Runs ALWAYS.
 */
public class Migration9 extends Migration {

    // -------------------------------------------------------------------------------------------------- Public Methods

    @Override
    public void run() {
        // Change "Arrow" data type "Text" -> "Entity"
        dmx.getTopicType(ARROW).setDataTypeUri(ENTITY);
        // Create "Locked" flag
        dmx.createTopicType(mf.newTopicTypeModel(LOCKED, "Locked", BOOLEAN));
        // Add "Locked" flag
        dmx.getTopicType(DOCUMENT).addCompDefBefore(mf.newCompDefModel(DOCUMENT, LOCKED, ONE), FILE + "#" + LANG1);
        dmx.getTopicType(LINQA_NOTE).addCompDef(mf.newCompDefModel(LINQA_NOTE, LOCKED, ONE));
        dmx.getTopicType(TEXTBLOCK).addCompDef(mf.newCompDefModel(TEXTBLOCK, LOCKED, ONE));
        dmx.getTopicType(HEADING).addCompDef(mf.newCompDefModel(HEADING, LOCKED, ONE));
        dmx.getTopicType(ARROW).addCompDef(mf.newCompDefModel(ARROW, LOCKED, ONE));
    }
}
