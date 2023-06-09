package systems.dmx.linqa.migrations;

import static systems.dmx.linqa.Constants.*;
import systems.dmx.core.Topic;
import systems.dmx.core.service.Inject;
import systems.dmx.core.service.Migration;
import systems.dmx.workspaces.WorkspacesService;
import systems.dmx.linqa.LinqaService;



/**
 * Creates viewports for all the ZW Shared Workspaces, and for the "Team" workspace.
 * <p>
 * Part of Linqa 1.1
 * Runs ALWAYS.
 */
public class Migration4 extends Migration {

    // ---------------------------------------------------------------------------------------------- Instance Variables

    @Inject private LinqaService zw;
    @Inject private WorkspacesService wss;

    // -------------------------------------------------------------------------------------------------- Public Methods

    @Override
    public void run() {
        zw.getAllZWWorkspaces().stream().forEach(ws -> {
            zw.createViewport(ws.getId());
        });
        zw.createViewport(wss.getWorkspace(TEAM_WORKSPACE_URI).getId());
    }
}
