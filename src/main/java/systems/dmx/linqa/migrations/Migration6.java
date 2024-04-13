package systems.dmx.linqa.migrations;

import static systems.dmx.linqa.Constants.*;

import systems.dmx.core.service.Migration;

import java.util.logging.Logger;



/**
 * Transforms existing "Arrow" instances.
 * Deletes topic type "Arrow".
 * <p>
 * Part of Linqa 1.8
 * Runs only in UPDATE mode.
 */
public class Migration6 extends Migration {

    // ------------------------------------------------------------------------------------------------------- Constants

    private static final String ARROW = "linqa.arrow";

    // ---------------------------------------------------------------------------------------------- Instance Variables

    private Logger logger = Logger.getLogger(getClass().getName());

    // -------------------------------------------------------------------------------------------------- Public Methods

    @Override
    public void run() {
        // 1) transform arrows into lines
        long count = dmx.getTopicsByType(ARROW).stream().filter(topic -> {
            topic.setTypeUri(LINE);
            return true;
        }).count();
        // 2) delete topic type "Arrow"
        dmx.deleteTopicType(ARROW);
        logger.info("### Linqa Arrow->Line transformation complete\n  Arrows transformed: " + count);
    }
}
