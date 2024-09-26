package systems.dmx.linqa.migrations;

import static systems.dmx.accesscontrol.Constants.*;
import static systems.dmx.core.Constants.*;
import static systems.dmx.linqa.Constants.*;

import systems.dmx.core.service.Migration;



/**
 * Extends topic types "Document", "Note", and "Textblock" by "Reaction".
 * <p>
 * Part of Linqa 2.0
 * Runs ALWAYS.
 */
public class Migration8 extends Migration {

    // -------------------------------------------------------------------------------------------------- Public Methods

    @Override
    public void run() {
        dmx.createAssocType(mf.newAssocTypeModel(REACTION, "Reaction", TEXT));
        dmx.getTopicType(DOCUMENT).addCompDef(mf.newCompDefModel(REACTION, false, false, DOCUMENT, USERNAME, MANY));
        dmx.getTopicType(LINQA_NOTE).addCompDef(mf.newCompDefModel(REACTION, false, false, LINQA_NOTE, USERNAME, MANY));
        dmx.getTopicType(TEXTBLOCK).addCompDef(mf.newCompDefModel(REACTION, false, false, TEXTBLOCK, USERNAME, MANY));
    }
}
