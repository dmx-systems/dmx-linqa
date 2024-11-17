package systems.dmx.linqa.migrations;

import static systems.dmx.linqa.Constants.*;

import systems.dmx.accesscontrol.AccessControlService;
import systems.dmx.core.RelatedTopic;
import systems.dmx.core.Topic;
import systems.dmx.core.service.Inject;
import systems.dmx.core.service.Migration;
import systems.dmx.linqa.EmailDigests.NotificationLevel;

import java.util.List;
import java.util.logging.Logger;



/**
 * Sets notification level of existing Linqa admins to "all".
 * <p>
 * Part of Linqa 2.0
 * Runs only in UPDATE mode.
 */
public class Migration7 extends Migration {

    // ---------------------------------------------------------------------------------------------- Instance Variables

    @Inject
    private AccessControlService acs;

    private Logger logger = Logger.getLogger(getClass().getName());

    // -------------------------------------------------------------------------------------------------- Public Methods

    @Override
    public void run() {
        long count = getLinqaAdmins().stream().filter(username -> {
            NotificationLevel.set(username, NotificationLevel.ALL);
            return true;
        }).count();
        logger.info("### NotificationLevel migration complete\n  Linqa admin accounts modified: " + count);
    }

    // ------------------------------------------------------------------------------------------------- Private Methods

    // Note: we can't call LinqaService's getLinqaAdmins() as `linqaAdminWs` is only initialized at init(),
    // that is after migrations has run.
    public List<RelatedTopic> getLinqaAdmins() {
        Topic linqaAdminWs = dmx.getTopicByUri(LINQA_ADMIN_WS_URI);
        return acs.getMemberships(linqaAdminWs.getId());
    }
}
