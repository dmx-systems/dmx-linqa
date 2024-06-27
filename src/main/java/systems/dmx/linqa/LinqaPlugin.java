package systems.dmx.linqa;

import static systems.dmx.accesscontrol.Constants.*;
import static systems.dmx.core.Constants.*;
import static systems.dmx.files.Constants.*;
import static systems.dmx.signup.Constants.*;
import static systems.dmx.topicmaps.Constants.*;
import static systems.dmx.workspaces.Constants.*;
import static systems.dmx.linqa.Constants.*;

import systems.dmx.accesscontrol.AccessControlService;
import systems.dmx.accesscontrol.event.PostLoginUser;
import systems.dmx.core.Assoc;
import systems.dmx.core.RelatedTopic;
import systems.dmx.core.Topic;
import systems.dmx.core.model.ChildTopicsModel;
import systems.dmx.core.model.SimpleValue;
import systems.dmx.core.model.TopicModel;
import systems.dmx.core.model.topicmaps.ViewProps;
import systems.dmx.core.model.topicmaps.ViewTopic;
import systems.dmx.core.osgi.PluginActivator;
import systems.dmx.core.service.Cookies;
import systems.dmx.core.service.Inject;
import systems.dmx.core.service.Transactional;
import systems.dmx.core.service.accesscontrol.PrivilegedAccess;
import systems.dmx.core.service.accesscontrol.SharingMode;
import systems.dmx.core.service.event.PostCreateAssoc;
import systems.dmx.core.service.event.PostUpdateTopic;
import systems.dmx.core.service.event.PreDeleteAssoc;
import systems.dmx.core.service.event.PreSendTopic;
import systems.dmx.core.storage.spi.DMXTransaction;
import systems.dmx.core.util.DMXUtils;
import systems.dmx.core.util.IdList;
import systems.dmx.core.util.JavaUtils;
import systems.dmx.deepl.DeepLService;
import systems.dmx.deepl.Translation;
import systems.dmx.facets.FacetsService;
import systems.dmx.files.FilesService;
import systems.dmx.files.StoredFile;
import systems.dmx.files.UploadedFile;
import systems.dmx.linqa.EmailDigests.NotificationLevel;
import systems.dmx.sendmail.SendmailService;
import systems.dmx.signup.SignupService;
import systems.dmx.timestamps.TimestampsService;
import systems.dmx.topicmaps.TopicmapCustomizer;
import systems.dmx.topicmaps.TopicmapsService;
import systems.dmx.workspaces.WorkspacesService;

import javax.ws.rs.Consumes;
import javax.ws.rs.GET;
import javax.ws.rs.POST;
import javax.ws.rs.PUT;
import javax.ws.rs.Path;
import javax.ws.rs.PathParam;
import javax.ws.rs.QueryParam;
import javax.ws.rs.Produces;
import javax.ws.rs.core.MediaType;
import javax.ws.rs.core.Response;
import static javax.ws.rs.core.Response.Status.*;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileReader;
import java.net.URL;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Properties;
import java.util.Random;
import java.util.ResourceBundle;
import java.util.function.BiConsumer;
import java.util.logging.Logger;
import java.util.stream.Collectors;

import com.sun.jersey.core.util.Base64;



@Path("/linqa")
@Produces(MediaType.APPLICATION_JSON)
public class LinqaPlugin extends PluginActivator implements LinqaService, TopicmapCustomizer, PostCreateAssoc,
                                                                                              PreDeleteAssoc,
                                                                                              PreSendTopic,
                                                                                              PostLoginUser {

    // ------------------------------------------------------------------------------------------------------- Constants

    private static final String CONFIG_LANG1 = System.getProperty("dmx.linqa.lang1"); // LANG1 is in use (Constans.java)
    private static final String CONFIG_LANG2 = System.getProperty("dmx.linqa.lang2"); // LANG2 is in use (Constans.java)

    private static final String HOST_URL = System.getProperty("dmx.host.url", "");

    private static final String DEFAULT_HELP_LANG = "en";

    // ---------------------------------------------------------------------------------------------- Instance Variables

    @Inject private DeepLService deepls;
    @Inject private TimestampsService timestamps;
    @Inject private TopicmapsService tms;
    @Inject private WorkspacesService ws;
    @Inject private AccessControlService acs;
    @Inject private FacetsService facets;
    @Inject private FilesService files;
    @Inject private SignupService signup;
    @Inject private SendmailService sendmail;

    private Topic zwPluginTopic;
    private Topic linqaAdminWs;
    private StringProvider sp = new LinqaStringProvider();
    private Messenger me;
    private Random random = new Random();

    private Logger logger = Logger.getLogger(getClass().getName());

    // -------------------------------------------------------------------------------------------------- Public Methods

    // Hooks

    @Override
    public void preInstall() {
        // initialize these before init() so migrations can operate on them
        zwPluginTopic = dmx.getTopicByUri(LINQA_PLUGIN_URI);
        linqaAdminWs = dmx.getTopicByUri(LINQA_ADMIN_WS_URI);
    }

    @Override
    public void init() {
        tms.registerTopicmapCustomizer(this);
        signup.setEmailTextProducer(new LinqaEmailTextProducer(sp));
        me = new Messenger(dmx.getWebSocketService());
        new EmailDigests(
            dmx, acs, ws, timestamps, sendmail, signup,
            JavaUtils.readTextURL(bundle.getResource("/app-strings/digest-email.html")),
            JavaUtils.readTextURL(bundle.getResource("/app-strings/digest-comment.html"))
        ).startTimedTask();
    }

    @Override
    public void shutdown() {
        tms.unregisterTopicmapCustomizer(this);
    }

    // Listeners

    /**
     * Creates required memberships for new Linqa admins.
     */
    @Override
    public void postCreateAssoc(Assoc assoc) {
        processLinqaAdminMembership(assoc, (usernameTopic, username) -> {
            // 1) Create "System" membership
            logger.info("### Inviting user \"" + username + "\" to \"System\" workspace");
            acs.createMembership(username, dmx.getPrivilegedAccess().getSystemWorkspaceId());
            // 2) Create Linqa shared workspace memberships
            List<RelatedTopic> workspaces = getAllLinqaWorkspaces();
            logger.info("### Inviting user \"" + username + "\" to " + workspaces.size() + " Linqa workspaces");
            acs.bulkUpdateMemberships(username, new IdList(workspaces), null);
            // 3) Set notification level to "ALL"
            NotificationLevel.set(usernameTopic, NotificationLevel.ALL);        // TODO: update client-state
        });
    }

    /**
     * Deletes "System" membership for users who loose Linqa admin status.
     */
    @Override
    public void preDeleteAssoc(Assoc assoc) {
        processLinqaAdminMembership(assoc, (usernameTopic, username) -> {
            // Delete "System" membership
            logger.info("### Removing \"System\" membership from user \"" + username + "\"");
            Assoc systemMembership = acs.getMembership(username, dmx.getPrivilegedAccess().getSystemWorkspaceId());
            // Note: in case of a delete-user operation the "System" membership might have been deleted already (null)
            if (systemMembership != null) {
                systemMembership.delete();
            }
            // Note: when a user looses Linqa admin status we don't know in which Linqa workspaces she stays.
            // We leave all memberships intact (no bulkUpdateMemberships() here).
        });
    }

    /**
     * Enriches:
     * - Comments by "Creator"
     *   - Comment-Refs by "Creator"
     *   - Textblock-Refs by "Color"
     * - Worksapces by "Owner"
     * - Usernames by "Display Name", "Show Email Address" flag, and "User Active" flag
     * - Memberships by "Editor" flag
     */
    @Override
    public void preSendTopic(Topic topic) {
        String typeUri = topic.getTypeUri();
        if (typeUri.equals(COMMENT)) {
            acs.enrichWithUserInfo(topic);
            Topic refComment = topic.getChildTopics().getTopicOrNull(COMMENT);
            if (refComment != null) {
                acs.enrichWithUserInfo(refComment);
            }
            Topic refTextblock = topic.getChildTopics().getTopicOrNull(TEXTBLOCK);
            if (refTextblock != null) {
                enrichWithColor(refTextblock);
            }
        } else if (typeUri.equals(WORKSPACE)) {
            acs.enrichWithOwnerInfo(topic);
        } else if (typeUri.equals(USERNAME)) {
            String username = topic.getSimpleValue().toString();
            ChildTopicsModel topics = topic.getChildTopics().getModel();
            String displayName = signup.getDisplayName(username);
            if (displayName != null) {
                topics.set(DISPLAY_NAME, displayName);
            }
            topics.set(SHOW_EMAIL_ADDRESS, getShowEmailAddress(username));
            enrichWithUsernameProps(topic);
        }
        // Note: in a Related Username Topic w/ a Membership *both* are enriched
        if (topic instanceof RelatedTopic) {
            Assoc assoc = ((RelatedTopic) topic).getRelatingAssoc();
            if (assoc.getTypeUri().equals(MEMBERSHIP)) {
                Topic editor = facets.getFacet(assoc, EDITOR_FACET);
                if (editor != null) {
                    String[] a = editor.getSimpleValue().toString().split(":");
                    boolean isEditor = Boolean.parseBoolean(a[1]);
                    assoc.getChildTopics().getModel().set(EDITOR, isEditor);
                }
            }
        }
    }

    @Override
    public void postLoginUser(String username) {
        DMXTransaction tx = dmx.beginTx();
        try {
            acs.getUsernameTopic(username).setProperty(USER_ACTIVE, true, false);       // addToIndex=false
            tx.success();
        } finally {
            tx.finish();
        }
    }

    // TopicmapCustomizer
    //
    // Note: as Topicmap is not a DMXObject no PRE_SEND event is fired, so we use a TopicmapCustomizer to enrich
    // the topic's view properties.

    /**
     * Enriches:
     * - Documents, Notes, Textblocks, Headings, Shapes, and Lines by "Angle"
     * - Notes and Textblocks by "Color"
     * - Viewports by "Zoom"
     */
    @Override
    public void customizeTopic(RelatedTopic topic, ViewProps viewProps) {
        fetchLinqaViewProps(topic.getTypeUri(), topic.getRelatingAssoc(), viewProps);
        // Note: when transporting a topic's "color" information to the frontend we can't use view props. The frontend
        // renders Textblocks not only on canvas but also in discussion panel, namely as colored textblock-refs. There
        // we have Topics, not ViewTopics, so there are no view props. The solution is to transport "color" as a
        // synthetic child value (in the topic model) instead.
        // Despite not strictly needed we do the same for Notes, Shapes, and Lines because the frontend handles the
        // color aspect (e.g. the color selector) of all these items uniformly by a common mixin
        // (see src/main/js/components/mixins/color-model.js)
        enrichWithColor(topic, viewProps);
    }

    // LinqaService

    @GET
    @Path("/config/lang")
    @Override
    public List<String> getLanguageConfig() {
        List<String> langs = new ArrayList();
        langs.add(CONFIG_LANG1);
        langs.add(CONFIG_LANG2);
        return langs;
    }

    @GET
    @Path("/help")
    @Override
    public List<String> getHelpPages() {
        // 1) identify help resource (source: external or bundled, language: UI or default)
        boolean external = false;   // external resource (file) OR bundled resource
        String lang = Cookies.get().get("linqa_lang");  // effective help language (can differ from UI language)
        String helpPath = multilingualResourcePath("help/", lang);
        String defaultHelpPath = multilingualResourcePath("help/", DEFAULT_HELP_LANG);
        File file = getExternalResourceFile(helpPath);
        if (file.exists()) {
            external = true;
        } else {
            file = getExternalResourceFile(defaultHelpPath);
            if (file.exists()) {
                external = true;
                lang = DEFAULT_HELP_LANG;
            } else {
                URL resource = bundle.getResource(helpPath);
                if (resource == null) {
                    resource = bundle.getResource(defaultHelpPath);
                    if (resource != null) {
                        lang = DEFAULT_HELP_LANG;
                    } else {
                        throw new RuntimeException("No help reources found");
                    }
                }
            }
        }
        logger.info("Loading help resources, external=" + external + ", lang=" + lang);
        // 2) read help resource (pages)
        List<String> texts = new ArrayList();
        int pageNr = 1;
        boolean exists = true;
        String resourcePath = multilingualResourcePath("help/page-%d.html", lang);
        do {
            String path = String.format(resourcePath, pageNr++);
            if (external) {
                file = getExternalResourceFile(path);
                if (file.exists()) {
                    texts.add(JavaUtils.readTextFile(file));
                } else {
                    exists = false;
                }
            } else {
                URL resource = bundle.getResource(path);
                if (resource != null) {
                    texts.add(JavaUtils.readTextURL(resource));
                } else {
                    exists = false;
                }
            }
        } while (exists);
        return texts;
    }

    @GET
    @Path("/config/{path:.+}")
    @Produces({MediaType.TEXT_HTML, "text/css", "image/png"})
    @Override
    public Response getConfigResource(@PathParam("path") String path,
                                      @QueryParam("multilingual") boolean multilingual) {
        try {
            File file = getExternalResourceFile(multilingual ?
                multilingualResourcePath(path, Cookies.get().get("linqa_lang")) :   // TODO: use CookieParam instead?
                path
            );
            String contentType = JavaUtils.getFileType(path);
            if (file.exists()) {
                return Response.ok(new FileInputStream(file)).type(contentType).build();
            } else {
                if (path.equals("logo.png") || path.equals("logo-small.png")) {     // TODO
                    return Response.ok(bundle.getResource("/linqa-logo.png").openStream()).type(contentType).build();
                } else {
                    return Response.status(NO_CONTENT).build();
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Retrieving config resource \"" + path + "\" failed (multilingual=" +
                multilingual + ")", e);
        }
    }

    @GET
    @Path("/workspaces")
    @Override
    public List<RelatedTopic> getLinqaWorkspaces() {
        try {
            // FIXME: public workspaces (w/o Membership) are not supported
            Topic username = acs.getUsernameTopic();
            if (username != null) {
                return getLinqaWorkspaces(username);
            } else {
                return new ArrayList();
            }
        } catch (Exception e) {
            throw new RuntimeException("Retrieving the user's Linqa workspaces failed", e);
        }
    }

    @GET
    @Path("/discussion")
    @Override
    public List<Topic> getDiscussion() {
        try {
            return DMXUtils.loadChildTopics(
                ws.getAssignedTopics(workspaceId(), COMMENT)
            );
        } catch (Exception e) {
            throw new RuntimeException("Retrieving the discussion for workspace " + workspaceId() + " failed", e);
        }
    }

    @GET
    @Path("/users")
    @Override
    public List<Topic> getAllUsers() {
        try {
            return dmx.getTopicsByType(USERNAME);
        } catch (Exception e) {
            throw new RuntimeException("Retrieving all Linqa users failed", e);
        }
    }

    @POST
    @Path("/document")
    @Transactional
    @Override
    public Topic createDocument(String docName, @QueryParam("fileId") long fileId) {
        try {
            TopicModel document = createBilingualTopicModel(DOCUMENT, docName, "_name");
            String lang = document.getChildTopics().getString(LANGUAGE + "#" + ORIGINAL_LANGUAGE);
            document.getChildTopics().setRef(FILE + "#linqa." + langSuffix(lang), fileId);
            return dmx.createTopic(document);
        } catch (Exception e) {
            throw new RuntimeException("Creating document failed, docName=\"" + docName + "\", fileId=" + fileId, e);
        }
    }

    @POST
    @Path("/note")
    @Transactional
    @Override
    public Topic createNote(String note) {
        try {
            return dmx.createTopic(createBilingualTopicModel(LINQA_NOTE, note));
        } catch (Exception e) {
            throw new RuntimeException("Creating note failed, note=\"" + note + "\"", e);
        }
    }

    @POST
    @Path("/textblock")
    @Transactional
    @Override
    public Topic createTextblock(String textblock) {
        try {
            return dmx.createTopic(createBilingualTopicModel(TEXTBLOCK, textblock));
        } catch (Exception e) {
            throw new RuntimeException("Creating textblock failed, textblock=\"" + textblock + "\"", e);
        }
    }

    @POST
    @Path("/heading")
    @Transactional
    @Override
    public Topic createHeading(String heading) {
        try {
            return dmx.createTopic(createBilingualTopicModel(HEADING, heading));
        } catch (Exception e) {
            throw new RuntimeException("Creating heading failed, heading=\"" + heading + "\"", e);
        }
    }

    @POST
    @Path("/comment")
    @Transactional
    @Override
    public Topic createComment(String comment, @QueryParam("refTopicIds") IdList refTopicIds,
                                               @QueryParam("fileTopicIds") IdList fileTopicIds) {
        try {
            return _createComment(createBilingualTopicModel(COMMENT, comment), refTopicIds, fileTopicIds);
        } catch (Exception e) {
            throw new RuntimeException("Creating comment failed, refTopicIds=" + refTopicIds + ", fileTopicIds=" +
                fileTopicIds, e);
        }
    }

    @POST
    @Path("/comment/monolingual")
    @Transactional
    @Override
    public Topic createMonolingualComment(String comment, @QueryParam("refTopicIds") IdList refTopicIds,
                                                          @QueryParam("fileTopicIds") IdList fileTopicIds) {
        try {
            // Note: a monolingual comment is stored in "lang1". "lang2" and "Original Language" are not set.
            return _createComment(mf.newTopicModel(COMMENT, mf.newChildTopicsModel()
                .set(COMMENT_TEXT + "#" + LANG1, comment)
            ), refTopicIds, fileTopicIds);
        } catch (Exception e) {
            throw new RuntimeException("Creating monolingual comment failed, refTopicIds=" + refTopicIds +
                ", fileTopicIds=" + fileTopicIds, e);
        }
    }

    @Override
    public Topic createViewport(long workspaceId) {
        List<Topic> topicmaps = ws.getAssignedTopics(workspaceId, TOPICMAP);
        if (topicmaps.size() != 1) {
            throw new RuntimeException("Workspace " + workspaceId + " has " + topicmaps.size() +
                " topicmaps (expected is 1)");
        }
        long topicmapId = topicmaps.get(0).getId();
        Topic viewport = dmx.createTopic(mf.newTopicModel(VIEWPORT, new SimpleValue("Viewport " + random.nextLong())));
        ViewProps viewProps = mf.newViewProps(0, 0, true, false);
        viewProps.set(ZOOM, 1);
        tms.addTopicToTopicmap(topicmapId, viewport.getId(), viewProps);
        return viewport;
    }

    @POST
    @Path("/translate")
    @Override
    public Translation translate(String text, @QueryParam("targetLang") String targetLang) {
        try {
            if (targetLang == null) {
                // "en" acts as dummy language, not used in this application.
                // This translation's sole purpose is language detection for the original text.
                Translation translation = deepls.translate(text, "en").get(0);
                String origLang = translation.detectedSourceLang;
                targetLang = targetLang(origLang);
            }
            // actual translation
            return deepls.translate(text, targetLang).get(0);
        } catch (Exception e) {
            throw new RuntimeException("Translation failed, text=\"" + text + "\", targetLang=" + targetLang, e);
        }
    }

    @POST
    @Path("/duplicate/{topicIds}")
    @Transactional
    @Override
    public List<ViewTopic> duplicateMulti(@PathParam("topicIds") IdList topicIds,
                                          @QueryParam("xyOffset") int xyOffset) {
        long topicmapId = topicmapId();
        return topicIds.stream().map(topicId -> {
            // 1) duplicate topic
            Topic topic = dmx.getTopic(topicId).loadChildTopics();
            TopicModel model = topic.getModel();
            model.getChildTopics().remove(LOCKED);      // don't duplicate Locked-state
            Topic dupTopic = dmx.createTopic(model);
            // 2) duplicate view props
            Assoc assoc = tms.getTopicMapcontext(topicmapId, topicId);
            ViewProps viewProps = tms.getTopicViewProps(topicmapId, topicId);
            fetchLinqaViewProps(topic.getTypeUri(), assoc, viewProps);
            enrichWithColor(dupTopic, viewProps);
            viewProps.set(X, viewProps.getInt(X) + xyOffset);
            viewProps.set(Y, viewProps.getInt(Y) + xyOffset);
            // 3) add to topicmap
            tms.addTopicToTopicmap(topicmapId, dupTopic.getId(), viewProps);
            return mf.newViewTopic(dupTopic.getModel(), viewProps);
        }).collect(Collectors.toList());
    }

    @PUT
    @Path("/locked/{locked}/{topicIds}")
    @Transactional
    @Override
    public void setLockedMulti(@PathParam("locked") boolean locked, @PathParam("topicIds") IdList topicIds) {
        topicIds.stream().forEach(topicId -> {
            dmx.updateTopic(mf.newTopicModel(topicId, mf.newChildTopicsModel().set(LOCKED, locked)));
        });
    }

    @PUT
    @Path("/user_profile")
    @Transactional
    @Override
    public void updateUserProfile(@QueryParam("displayName") String displayName,
                                  @QueryParam("showEmailAddress") boolean showEmailAddress,
                                  @QueryParam("notificationLevel") NotificationLevel notificationLevel) {
        String username = acs.getUsername();
        signup.updateDisplayName(username, displayName);
        updateShowEmailAddressFacet(username, showEmailAddress);
        NotificationLevel.set(acs.getUsernameTopic(username), notificationLevel);
    }

    @POST
    @Path("/image")
    @Consumes("multipart/form-data")
    @Transactional
    @Override
    public StoredFile storeScaledImage(UploadedFile originalImage) {
        try {
            UploadedFile scaledImage = new ImageScaler().scale(originalImage);
            UploadedFile image;
            if (scaledImage != null) {
                image = scaledImage;
                files.storeFile(originalImage, "/");    // keep original image
            } else {
                image = originalImage;
            }
            return files.storeFile(image, "/");
        } catch (Exception e) {
            throw new RuntimeException("Uploading image " + originalImage + " failed", e);
        }
    }

    // --- Admin ---

    @GET
    @Path("/admin/workspaces")
    @Override
    public List<RelatedTopic> getAllLinqaWorkspaces() {
        try {
            return DMXUtils.loadChildTopics(
                // We retrieve the Plugin topic on-the-fly to allow this method to be called from a migration.
                // Note: migrations run *before* the plugin's init hook is triggered, so we can't rely on
                // "zwPluginTopic" here as it is not yet initialized.
                dmx.getTopicByUri(LINQA_PLUGIN_URI).getRelatedTopics(SHARED_WORKSPACE, DEFAULT, DEFAULT, WORKSPACE)
            );
        } catch (Exception e) {
            throw new RuntimeException("Retrieving all Linqa workspaces failed", e);
        }
    }

    @GET
    @Path("/admin/user/{username}/workspaces")
    @Override
    public List<RelatedTopic> getLinqaWorkspacesOfUser(@PathParam("username") String username) {
        try {
            Topic usernameTopic = acs.getUsernameTopic(username);
            if (usernameTopic == null) {
                throw new IllegalArgumentException("No such user: \"" + username + "\"");
            }
            List<RelatedTopic> workspaces = getLinqaWorkspaces(usernameTopic);
            Assoc membership = acs.getMembership(username, linqaAdminWs.getId());
            if (membership != null) {
                workspaces.add(membership.getDMXObjectByType(WORKSPACE).loadChildTopics());
            }
            return workspaces;
        } catch (Exception e) {
            throw new RuntimeException("Retrieving Linqa workspaces of user \"" + username + "\" failed", e);
        }
    }

    @Override
    public List<RelatedTopic> getLinqaAdmins() {
        return acs.getMemberships(linqaAdminWs.getId());
    }

    @PUT
    @Path("/admin/workspace/{workspaceId}")
    @Transactional
    @Override
    public List<RelatedTopic> bulkUpdateWorkspaceMemberships(@PathParam("workspaceId") long workspaceId,
                                                             @QueryParam("addUserIds1") IdList addUserIds1,
                                                             @QueryParam("removeUserIds1") IdList removeUserIds1,
                                                             @QueryParam("addUserIds2") IdList addUserIds2,
                                                             @QueryParam("removeUserIds2") IdList removeUserIds2) {
        try {
            // 1) Update Memberships
            List<RelatedTopic> users = acs.bulkUpdateMemberships(workspaceId, addUserIds1, removeUserIds1);
            // 2) Update Editor role
            if (removeUserIds2 != null) {
                for (long userId : removeUserIds2) {
                    updateEditorFacet(userId, workspaceId, false);
                }
            }
            if (addUserIds2 != null) {
                for (long userId : addUserIds2) {
                    updateEditorFacet(userId, workspaceId, true);
                }
            }
            return users;
        } catch (Exception e) {
            throw new RuntimeException("Editor role bulk update for Linqa workspace " + workspaceId + " failed", e);
        }
    }

    @PUT
    @Path("/admin/user/{username}")
    @Transactional
    @Override
    public List<RelatedTopic> bulkUpdateUserMemberships(@PathParam("username") String username,
                                                        @QueryParam("addWorkspaceIds1") IdList addWorkspaceIds1,
                                                        @QueryParam("removeWorkspaceIds1") IdList removeWorkspaceIds1,
                                                        @QueryParam("addWorkspaceIds2") IdList addWorkspaceIds2,
                                                        @QueryParam("removeWorkspaceIds2") IdList removeWorkspaceIds2) {
        try {
            // 1) Update Memberships
            acs.bulkUpdateMemberships(username, addWorkspaceIds1, removeWorkspaceIds1);
            // 2) Update Editor role
            if (removeWorkspaceIds2 != null) {
                for (long wsId : removeWorkspaceIds2) {
                    updateEditorFacet(username, wsId, false);
                }
            }
            if (addWorkspaceIds2 != null) {
                for (long wsId : addWorkspaceIds2) {
                    updateEditorFacet(username, wsId, true);
                }
            }
            return getLinqaWorkspacesOfUser(username);
        } catch (Exception e) {
            throw new RuntimeException("Editor role bulk update for user \"" + username + "\" failed", e);
        }
    }

    @POST
    @Path("/admin/user/{emailAddress}/{displayName}/{lang}")
    @Transactional
    @Override
    public Topic createLinqaUser(@PathParam("emailAddress") String emailAddress,
                                 @PathParam("displayName") String displayName,
                                 @PathParam("lang") String lang) {
        try {
            // Note: a Linqa username is the email address
            Topic usernameTopic = signup.createUserAccount(emailAddress, emailAddress, displayName, newPassword());
            sendWelcomeMail(emailAddress, displayName, lang);
            return usernameTopic;
        } catch (Exception e) {
            throw new RuntimeException("Creating Linqa user \"" + displayName + "\" failed, emailAddress=\"" +
                emailAddress + "\", lang=\"" + lang + "\"", e);
        }
    }

    @POST
    @Path("/admin/workspace")
    @Transactional
    @Override
    public Topic createLinqaWorkspace(@QueryParam("nameLang1") String nameLang1,
                                      @QueryParam("nameLang2") String nameLang2) {
        try {
            // 1) Create workspace
            Topic workspace = ws.createWorkspace(nameLang1, null, SharingMode.COLLABORATIVE);
            workspace.update(mf.newChildTopicsModel()
                .set(WORKSPACE_NAME + "#" + LANG1, nameLang1)
                .set(WORKSPACE_NAME + "#" + LANG2, nameLang2)
            );
            // 2) Mark it as "Linqa Shared Workspace"
            long workspaceId = workspace.getId();
            dmx.getPrivilegedAccess().runInWorkspaceContext(workspaceId, () -> {
                dmx.createAssoc(mf.newAssocModel(
                    SHARED_WORKSPACE,
                    mf.newTopicPlayerModel(LINQA_PLUGIN_URI, DEFAULT),
                    mf.newTopicPlayerModel(workspaceId, DEFAULT)
                ));
                return null;
            });
            // 3) Create vieport for new workspace
            createViewport(workspaceId);
            // 4) Grant access to all Linqa admins
            List<RelatedTopic> usernames = getLinqaAdmins();
            logger.info("### Inviting " + usernames.size() + " Linqa admins to workspace \"" +
                workspace.getSimpleValue() + "\"");
            acs.bulkUpdateMemberships(workspaceId, new IdList(usernames), null);
            return workspace;
        } catch (Exception e) {
            throw new RuntimeException("Creating a Linqa workspace failed", e);
        }
    }



    // ------------------------------------------------------------------------------------------------- Private Methods

    private TopicModel createBilingualTopicModel(String topicTypeUri, String text) {
        return createBilingualTopicModel(topicTypeUri, text, "_text");
    }

    private TopicModel createBilingualTopicModel(String topicTypeUri, String text, String uriSuffix) {
        Translation translation = translate(text, null);
        String origLang = translation.detectedSourceLang;
        return mf.newTopicModel(topicTypeUri, mf.newChildTopicsModel()
            .set(topicTypeUri + uriSuffix + "#linqa." + langSuffix(origLang), text)
            .set(topicTypeUri + uriSuffix + "#linqa." + targetLang(origLang, true), translation.text)
            .set(LANGUAGE + "#" + ORIGINAL_LANGUAGE, origLang)               // asUriSuffix=true
        );
    }

    /**
     * @param   origLang    an ISO 639-1 language code, e.g. "de", "fr", "fi", "sv"
     */
    private String targetLang(String origLang) {
        return targetLang(origLang, false);
    }

    /**
     * @param   origLang    an ISO 639-1 language code, e.g. "de", "fr", "fi", "sv"
     */
    private String targetLang(String origLang, boolean asUriSuffix) {
        if (origLang.equals(CONFIG_LANG1)) {
            return asUriSuffix ? "lang2" : CONFIG_LANG2;
        } else if (origLang.equals(CONFIG_LANG2)) {
            return asUriSuffix ? "lang1" : CONFIG_LANG1;
        } else {
            // Note: the regex in error-handling.js mixin must match this message
            throw new RuntimeException("Unsupported original language: \"" + origLang + "\" (detected)");
        }
    }

    /**
     * @param   lang    an ISO 639-1 language code, e.g. "de", "fr", "fi", "sv"
     */
    private String langSuffix(String lang) {
        if (lang.equals(CONFIG_LANG1)) {
            return "lang1";
        } else if (lang.equals(CONFIG_LANG2)) {
            return "lang2";
        } else {
            throw new RuntimeException("Unsupported language: \"" + lang + "\" (detected)");
        }
    }

    private Topic _createComment(TopicModel commentModel, IdList refTopicIds, IdList fileTopicIds) {
        // add comment/document ref
        if (refTopicIds != null) {
            for (long refTopicId : refTopicIds) {
                String compDefUri = dmx.getTopic(refTopicId).getTypeUri();
                commentModel.getChildTopics().setRef(compDefUri, refTopicId);
            }
        }
        // add attachments
        if (fileTopicIds != null) {
            for (long fileTopicId : fileTopicIds) {
                commentModel.getChildTopics().addRef(FILE + "#" + ATTACHMENT, fileTopicId);
            }
        }
        //
        Topic commentTopic = dmx.createTopic(commentModel);
        acs.enrichWithUserInfo(commentTopic);
        timestamps.enrichWithTimestamps(commentTopic);
        me.addComment(workspaceId(), commentTopic);
        return commentTopic;
    }

    /**
     * Fetches a topic's Linqa specific view properties and stores them in the given ViewProps object.
     * These properties are fetched:
     * - "linqa.color" (optional), used for Notes and Textblocks
     * - "linqa.angle" (optional), used for Documents, Notes, Textblocks, Headings, Shapes, and Lines
     * - "linqa.shape_type" (optional), used for Shape
     * - "dmx.topicmaps.zoom" (mandatory), used for Viewports
     *
     * @param   topicTypeUri    the type of the topic for which the view props are fetched
     * @param   assoc           the topicmap context of the topic
     * @param   viewProps       the fetched view props are stored into this ViewProps object
     */
    private void fetchLinqaViewProps(String topicTypeUri, Assoc assoc, ViewProps viewProps) {
        if (assoc.hasProperty(LINQA_COLOR)) {   // "color" is an optional view prop
            viewProps.set(LINQA_COLOR, assoc.getProperty(LINQA_COLOR));
        }
        if (assoc.hasProperty(ANGLE)) {         // "angle" is an optional view prop
            viewProps.set(ANGLE, assoc.getProperty(ANGLE));
        }
        if (assoc.hasProperty(SHAPE_TYPE)) {    // "shape_type" is an optional view prop
            viewProps.set(SHAPE_TYPE, assoc.getProperty(SHAPE_TYPE));
        }
        if (assoc.hasProperty(ARROWHEADS)) {    // "arrowheads" is an optional view prop
            viewProps.set(ARROWHEADS, assoc.getProperty(ARROWHEADS));
        }
        if (assoc.hasProperty(LINE_STYLE)) {    // "line_style" is an optional view prop
            viewProps.set(LINE_STYLE, assoc.getProperty(LINE_STYLE));
        }
        if (topicTypeUri.equals(VIEWPORT)) {
            viewProps.set(ZOOM, assoc.getProperty(ZOOM));   // a viewport's "zoom" value is mandatory
        }
    }

    /**
     * Enriches the given topic by "color" information.
     * The "color" information is read from DB, from current topicmap (based on topicmap cookie).
     */
    private void enrichWithColor(Topic topic) {
        Assoc assoc = tms.getTopicMapcontext(topicmapId(), topic.getId());
        // Note: assoc can be null if requested by non-Linqa application e.g. DMX Webclient
        if (assoc != null && assoc.hasProperty(LINQA_COLOR)) {      // Color is an optional view prop
            topic.getChildTopics().getModel().set(LINQA_COLOR, assoc.getProperty(LINQA_COLOR));
        }
    }

    /**
     * Enriches the given topic by "color" information.
     * The "color" information is taken from given view props.
     */
    private void enrichWithColor(Topic topic, ViewProps viewProps) {
        String color = viewProps.getString(LINQA_COLOR);
        if (color != null) {   // Color is an optional view prop
            topic.getChildTopics().getModel().set(LINQA_COLOR, color);
        }
    }

    private void enrichWithUsernameProps(Topic username) {
        // Note: if no notification level stored in DB NotificationLevel.getAsString() returns the default value
        username.getChildTopics().getModel().set(NOTIFICATION_LEVEL, NotificationLevel.getAsString(username));
        if (username.hasProperty(USER_ACTIVE)) {                    // "User Active" is an optional DB prop
            username.getChildTopics().getModel().set(USER_ACTIVE, username.getProperty(USER_ACTIVE));
        }
    }

    private void processLinqaAdminMembership(Assoc assoc, BiConsumer<Topic, String> consumer) {
        if (assoc.getTypeUri().equals(MEMBERSHIP)) {
            Topic workspace = assoc.getDMXObjectByType(WORKSPACE);
            if (workspace.getUri().equals(LINQA_ADMIN_WS_URI)) {
                Topic usernameTopic = assoc.getDMXObjectByType(USERNAME);
                String username = usernameTopic.getSimpleValue().toString();
                consumer.accept(usernameTopic, username);
            }
        }
    }

    private List<RelatedTopic> getLinqaWorkspaces(Topic username) {
        return DMXUtils.loadChildTopics(
            username.getRelatedTopics(MEMBERSHIP, DEFAULT, DEFAULT, WORKSPACE)
                .stream().filter(this::isLinqaWorkspace).collect(Collectors.toList())
        );
    }

    private boolean isLinqaWorkspace(Topic workspace) {
        return dmx.getAssocBetweenTopicAndTopic(
            SHARED_WORKSPACE, workspace.getId(), zwPluginTopic.getId(), DEFAULT, DEFAULT
        ) != null;
    }

    private long workspaceId() {
        return Cookies.get().getLong("dmx_workspace_id");
    }

    private long topicmapId() {
        return Cookies.get().getLong("dmx_topicmap_id");
    }

    // convenience
    private void updateEditorFacet(long userId, long workspaceId, boolean editor) throws Exception {
        updateEditorFacet(getUsername(userId), workspaceId, editor);
    }

    private void updateEditorFacet(String username, long workspaceId, boolean editor) throws Exception {
        dmx.getPrivilegedAccess().runInWorkspaceContext(workspaceId, () -> {
            Assoc assoc = acs.getMembership(username, workspaceId);
            if (assoc != null) {
                facets.updateFacet(assoc, EDITOR_FACET, mf.newFacetValueModel(EDITOR).set(workspaceId + ":" + editor));
            }
            return null;
        });
    }

    private boolean getShowEmailAddress(String username) {
        try {
            Topic usernameTopic = acs.getUsernameTopic(username);
            Topic showEmailAddress = facets.getFacet(usernameTopic, SHOW_EMAIL_ADDRESS_FACET);
            if (showEmailAddress != null) {
                return showEmailAddress.getSimpleValue().booleanValue();
            }
            return false;
        } catch (Exception e) {
            throw new RuntimeException("Fetching \"Show Email Address\" flag of user \"" + username + "\" failed", e);
        }
    }

    private void updateShowEmailAddressFacet(String username, boolean showEmailAddress) {
        try {
            PrivilegedAccess pa = dmx.getPrivilegedAccess();
            pa.runInWorkspaceContext(getDisplayNamesWorkspaceId(), () -> {
                Topic usernameTopic = acs.getUsernameTopic(username);
                if (usernameTopic != null) {
                    facets.updateFacet(usernameTopic, SHOW_EMAIL_ADDRESS_FACET,
                        mf.newFacetValueModel(SHOW_EMAIL_ADDRESS).set(showEmailAddress)
                    );
                }
                return null;
            });
        } catch (Exception e) {
            throw new RuntimeException("Updating \"Show Email Address\" flag (" + showEmailAddress + ") of user \"" +
                username + "\" failed", e);
        }
    }

    /**
     * @param   id      ID of an Username topic
     */
    private String getUsername(long id) {       // ### Copied from AccessControlPlugin.java
        Topic username = dmx.getTopic(id);
        String typeUri = username.getTypeUri();
        if (!typeUri.equals(USERNAME)) {
            throw new IllegalArgumentException("Topic " + id + " is not a Username (but a \"" + typeUri + "\")");
        }
        return username.getSimpleValue().toString();
    }

    private long getDisplayNamesWorkspaceId() {
        return dmx.getTopicByUri(DISPLAY_NAME_WS_URI).getId();
    }

    private String newPassword() {
        return new String(Base64.encode(Double.toString(Math.random())));           // TODO: * Long.MAX_VALUE
    }

    private void sendWelcomeMail(String emailAddress, String displayName, String lang) {
        try {
            String link = HOST_URL + "/#/password-reset?email=" + emailAddress + "&lang=" + lang;
            String subject = sp.getString(lang, "welcome_mail.subject");
            String message = sp.getString(lang, "welcome_mail.message", displayName, link);
            sendmail.doEmailRecipient(subject, message, null, emailAddress);        // htmlMessage=null
        } catch (Exception e) {
            throw new RuntimeException("Sending welcome mail for \"" + displayName + "\" (" + emailAddress + ") failed",
                e);
        }
    }

    // Resources

    private File getExternalResourceFile(String path) {
        return new File(DMXUtils.getConfigDir() + "dmx-linqa/" + path);
    }

    /**
     * @param   lang        the language code inserted in the given path
     */
    private String multilingualResourcePath(String path, String lang) {
        int i = path.indexOf('/');      // insertion point for language code, either first directory, or file
        if (i == -1) {
            i = path.lastIndexOf('.');
            if (i == -1) {
                throw new RuntimeException("No file extension recognized in \"" + path + "\"");
            }
        }
        return path.substring(0, i) + "." + lang + path.substring(i);
    }

    // -------------------------------------------------------------------------------------------------- Nested Classes

    private class LinqaStringProvider implements StringProvider {

        @Override
        public String getString(String lang, String key, Object... args) {
            try {
                String str = null;
                // 1) external resource file
                File f = new File(DMXUtils.getConfigDir() + "dmx-linqa/strings." + lang + ".properties");
                if (f.exists()) {
                    Properties props = new Properties();
                    props.load(new FileReader(f));          // throws IOException, FileNotFoundException
                    str = props.getProperty(key);
                }
                // 2) Fallback: embedded resource
                if (str == null) {
                    ResourceBundle rb = ResourceBundle.getBundle("app-strings/", new Locale(lang), new UTF8Control());
                    str = rb.getString(key);
                }
                //
                return String.format(str, args);
            } catch (Exception e) {
                throw new RuntimeException("Getting \"" + key + "\" resource failed, lang=\"" + lang + "\"");
            }
        }
    }
}
