package systems.dmx.linqa.migrations;

import static systems.dmx.accesscontrol.Constants.*;
import static systems.dmx.core.Constants.*;
import static systems.dmx.workspaces.Constants.*;
import static systems.dmx.linqa.Constants.*;

import systems.dmx.accesscontrol.AccessControlService;
import systems.dmx.core.Topic;
import systems.dmx.core.service.Inject;
import systems.dmx.core.service.Migration;
import systems.dmx.core.service.accesscontrol.SharingMode;
import systems.dmx.linqa.LinqaService;
import systems.dmx.workspaces.WorkspacesService;



/**
 * Extends topic type "Workspace" by 2 more "Workspace Name"s (lang1+lang2).
 * Creates the "Linqa Administration" workspace, sets its owner and its "lang1" name.
 * Creates a viewport topic for the workspace.
 * <p>
 * Part of Linqa 1.0
 * Runs ALWAYS.
 */
public class Migration2 extends Migration {

    // ---------------------------------------------------------------------------------------------- Instance Variables

    @Inject private LinqaService lq;
    @Inject private WorkspacesService wss;
    @Inject private AccessControlService acs;

    // -------------------------------------------------------------------------------------------------- Public Methods

    @Override
    public void run() {
        //
        // Extend "Workspace" type
        dmx.getTopicType(WORKSPACE)
            .addCompDefBefore(mf.newCompDefModel(LANG1, false, false, WORKSPACE, WORKSPACE_NAME, ONE), SHARING_MODE)
            .addCompDefBefore(mf.newCompDefModel(LANG2, false, false, WORKSPACE, WORKSPACE_NAME, ONE), SHARING_MODE);
        //
        // Create "Linqa Administration" workspace ### FIXME: make it COLLABORATIVE (instead PUBLIC)?
        Topic linqaAdminWs = wss.createWorkspace(LINQA_ADMIN_WS_NAME, LINQA_ADMIN_WS_URI, SharingMode.PUBLIC);
        acs.setWorkspaceOwner(linqaAdminWs, ADMIN_USERNAME);
        linqaAdminWs.update(mf.newChildTopicsModel().set(WORKSPACE_NAME + "#" + LANG1, LINQA_ADMIN_WS_NAME));
        lq.createViewport(linqaAdminWs.getId());
    }
}
