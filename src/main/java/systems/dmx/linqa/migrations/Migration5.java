package systems.dmx.linqa.migrations;

import static systems.dmx.core.Constants.*;
import static systems.dmx.linqa.Constants.*;

import systems.dmx.core.service.Inject;
import systems.dmx.core.service.Migration;



/**
 * Creates topic type "Line" and transforms existing "Arrow" instances.
 * Deletes topic type "Arrow".
 * <p>
 * Part of Linqa 1.8
 * Runs ALWAYS.
 */
public class Migration5 extends Migration {

    // -------------------------------------------------------------------------------------------------- Public Methods

    @Override
    public void run() {
        dmx.createTopicType(
            mf.newTopicTypeModel(LINE, "Line", ENTITY)
                .addCompDef(mf.newCompDefModel(LINE, LOCKED, ONE))
        );
        // TODO
    }
}
