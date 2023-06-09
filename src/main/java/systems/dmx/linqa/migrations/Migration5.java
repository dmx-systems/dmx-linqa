package systems.dmx.linqa.migrations;

import static systems.dmx.core.Constants.*;
import static systems.dmx.linqa.Constants.*;
import systems.dmx.core.service.Migration;



/**
 * Redefine the "Editor" topic type.
 * <p>
 * Part of Linqa 1.2
 * Runs ALWAYS.
 */
public class Migration5 extends Migration {

    // -------------------------------------------------------------------------------------------------- Public Methods

    @Override
    public void run() {
        dmx.getTopicsByType(EDITOR).stream().forEach(t -> t.delete());      // delete all instances
        dmx.getTopicType(EDITOR).setDataTypeUri(TEXT);                      // change data type Boolean -> Text
    }
}
