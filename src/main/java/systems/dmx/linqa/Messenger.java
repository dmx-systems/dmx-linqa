package systems.dmx.linqa;

import systems.dmx.core.Topic;
import systems.dmx.core.service.websocket.WebSocketService;

import org.codehaus.jettison.json.JSONObject;

import java.util.logging.Level;
import java.util.logging.Logger;



class Messenger {

    // ---------------------------------------------------------------------------------------------- Instance Variables

    private WebSocketService wss;

    private Logger logger = Logger.getLogger(getClass().getName());

    // ---------------------------------------------------------------------------------------------------- Constructors

    Messenger(WebSocketService wss) {
        this.wss = wss;
    }

    // ----------------------------------------------------------------------------------------- Package Private Methods

    void addComment(long workspaceId, Topic comment) {
        try {
            sendToAllButOrigin(new JSONObject()
                .put("type", "addComment")
                .put("args", new JSONObject()
                    .put("workspaceId", workspaceId)
                    .put("comment", comment.toJSON())
                )
            );
        } catch (Exception e) {
            logger.log(Level.WARNING, "Error while sending a \"addComment\" message:", e);
        }
    }

    // ------------------------------------------------------------------------------------------------- Private Methods

    private void sendToAllButOrigin(JSONObject message) {
        wss.sendToAllButOrigin(message.toString());
    }

    private void sendToReadAllowed(JSONObject message, long objectId) {
        wss.sendToReadAllowed(message.toString(), objectId);
    }
}
