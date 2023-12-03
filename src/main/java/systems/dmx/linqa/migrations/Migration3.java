package systems.dmx.linqa.migrations;

import static systems.dmx.linqa.Constants.*;
import systems.dmx.core.Topic;
import systems.dmx.core.service.Inject;
import systems.dmx.core.service.Migration;
import systems.dmx.workspaces.WorkspacesService;
import systems.dmx.linqa.LinqaService;



/**
 * Creates viewports for all the Linqa Shared Workspaces, and for the "Team" workspace.
 * <p>
 * Part of Linqa 1.1
 * Runs ALWAYS.
 */
public class Migration3 extends Migration {

    // ---------------------------------------------------------------------------------------------- Instance Variables

    @Inject private LinqaService lq;
    @Inject private WorkspacesService wss;

    // -------------------------------------------------------------------------------------------------- Public Methods

    @Override
    public void run() {
        lq.getAllLinqaWorkspaces().stream().forEach(ws -> {
            lq.createViewport(ws.getId());
        });
        lq.createViewport(wss.getWorkspace(TEAM_WORKSPACE_URI).getId());
    }
}
