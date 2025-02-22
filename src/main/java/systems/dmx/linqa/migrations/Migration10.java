package systems.dmx.linqa.migrations;

import static systems.dmx.core.Constants.*;
import static systems.dmx.linqa.Constants.*;

import systems.dmx.core.service.Migration;



/**
 * Extends "Comment" by "Note".
 * <p>
 * Part of Linqa 2.1
 * Runs only in UPDATE mode.
 */
public class Migration10 extends Migration {

    // -------------------------------------------------------------------------------------------------- Public Methods

    @Override
    public void run() {
        dmx.getTopicType(COMMENT).addCompDefBefore(mf.newCompDefModel(COMMENT, LINQA_NOTE, ONE), TEXTBLOCK);
    }
}
