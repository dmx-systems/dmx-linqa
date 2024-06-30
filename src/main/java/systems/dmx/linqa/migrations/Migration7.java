package systems.dmx.linqa.migrations;

import systems.dmx.core.service.Inject;
import systems.dmx.core.service.Migration;
import systems.dmx.linqa.EmailDigests.NotificationLevel;
import systems.dmx.linqa.LinqaService;

import java.util.logging.Logger;



/**
 * Sets notification level of existing admins to "all".
 * <p>
 * Part of Linqa 1.8
 * Runs ALWAYS.
 */
public class Migration7 extends Migration {

    // ------------------------------------------------------------------------------------------------------- Constants

    // ---------------------------------------------------------------------------------------------- Instance Variables

    @Inject
    private LinqaService lqs;

    private Logger logger = Logger.getLogger(getClass().getName());

    // -------------------------------------------------------------------------------------------------- Public Methods

    @Override
    public void run() {
        long count = lqs.getLinqaAdmins().stream().filter(username -> {
            NotificationLevel.set(username, NotificationLevel.ALL);
            return true;
        }).count();
        logger.info("### NotificationLevel migration complete\n  Admin accounts modified: " + count);
    }
}
