package systems.dmx.linqa;

import systems.dmx.core.RelatedTopic;
import systems.dmx.core.Topic;
import systems.dmx.core.model.topicmaps.ViewTopic;
import systems.dmx.core.util.IdList;
import systems.dmx.deepl.Translation;
import systems.dmx.files.StoredFile;
import systems.dmx.files.UploadedFile;
import systems.dmx.linqa.EmailDigests.NotificationLevel;

import java.util.List;
import javax.ws.rs.core.Response;



public interface LinqaService {

    List<String> getLanguageConfig();

    List<String> getHelpPages();

    Response getConfigResource(String path, boolean multilingual, String lang);

    /**
     * Returns the Linqa shared workspaces of the current user (according to request authorization).
     *
     * @return  the workspaces as a list of RelatedTopics. Their "relating associations" are the Memberships.
     *          Note: the "Linqa Administration" workspace is not included.
     */
    List<RelatedTopic> getLinqaWorkspaces();

    /**
     * Returns the comments of the current workspace (according to workspace cookie).
     */
    List<Topic> getDiscussion();

    List<Topic> getAllUsers();

    Topic createDocument(String docName, long fileId);

    Topic createNote(String note);

    Topic createTextblock(String textblock);

    Topic createHeading(String heading);

    // Note: shapes/lines are created by generic createTopic() calls. No auto-translation is involved.

    Topic createComment           (String comment, IdList refTopicIds, IdList fileTopicIds);
    Topic createMonolingualComment(String comment, IdList refTopicIds, IdList fileTopicIds);

    /**
     * Needed by migration 2.
     */
    Topic createViewport(long workspaceId);

    /**
     * @param       targetLang          "lang1", "lang2", or null. If null the source lang, and thus the target lang,
     *                                  is auto-detected (by the means of an extra request to the DeepL API).
     *
     * @throws      RuntimeException    if auto-detection was solicited and an unsupported language was detected.
     *                                  Supported languages are "lang1" and "lang2".
     */
    Translation translate(String text, String targetLang);

    /**
     * Adds an emoji reaction for the current user.
     * If that emoji is added already (by the current user) nothing happens.
     */
    void addEmojiReaction(long topicId, String emoji);

    /**
     * Removes an emoji reaction for the current user.
     * If there is no such emoji reaction (by the current user) nothing happens.
     */
    void removeEmojiReaction(long topicId, String emoji);

    List<ViewTopic> duplicateMulti(IdList topicIds, int xyOffset);

    void setLockedMulti(boolean locked, IdList topicIds);

    /**
     * Updates the profile of the current user.
     */
    void updateUserProfile(String displayName, boolean showEmailAddress, NotificationLevel notificationLevel);

    StoredFile storeScaledImage(UploadedFile imageFile);

    // --- Admin ---

    /**
     * Returns all Linqa shared workspaces. Note: the "Linqa Administration" workspace is not included.
     */
    List<RelatedTopic> getAllLinqaWorkspaces();

    /**
     * Returns the Linqa shared workspaces of the given user plus the "Linqa Administration" workspace, if the
     * given user is a Linqa admin.
     */
    List<RelatedTopic> getLinqaWorkspacesOfUser(String username);

    /**
     * Returns all Linqa admins.
     *
     * @return    list of Username topics.
     */
    List<RelatedTopic> getLinqaAdmins();

    List<RelatedTopic> bulkUpdateWorkspaceMemberships(long workspaceId, IdList addUserIds1, IdList removeUserIds1,
                                                                        IdList addUserIds2, IdList removeUserIds2);
    List<RelatedTopic> bulkUpdateUserMemberships(String username, IdList addWorkspaceIds1, IdList removeWorkspaceIds1,
                                                                  IdList addWorkspaceIds2, IdList removeWorkspaceIds2);

    Topic createLinqaUser(String emailAddress, String displayName, String language);

    Topic createLinqaWorkspace(String nameLang1, String nameLang2);
}
