package systems.dmx.linqa.migrations;

import static systems.dmx.workspaces.Constants.*;
import static systems.dmx.linqa.Constants.*;

import systems.dmx.core.service.Inject;
import systems.dmx.core.service.Migration;
import systems.dmx.workspaces.WorkspacesService;



/**
 * Sets German name for "Team" workspace.
 * <p>
 * Part of Linqa 1.2
 * Runs ALWAYS.
 */
public class Migration6 extends Migration {

    // ---------------------------------------------------------------------------------------------- Instance Variables

    @Inject private WorkspacesService wss;

    // -------------------------------------------------------------------------------------------------- Public Methods

    @Override
    public void run() {
        wss.getWorkspace(TEAM_WORKSPACE_URI).update(mf.newChildTopicsModel()
            .set(WORKSPACE_NAME + "#" + DE, TEAM_WORKSPACE_NAME)
        );
    }
}
