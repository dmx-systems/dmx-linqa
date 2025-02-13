package systems.dmx.linqa;

import static systems.dmx.accesscontrol.Constants.*;
import static systems.dmx.timestamps.Constants.*;
import static systems.dmx.linqa.Constants.*;

import systems.dmx.accesscontrol.AccessControlService;
import systems.dmx.core.Topic;
import systems.dmx.core.service.CoreService;
import systems.dmx.core.util.DMXUtils;
import systems.dmx.core.util.JavaUtils;
import systems.dmx.sendmail.SendmailService;
import systems.dmx.signup.SignupService;
import systems.dmx.timestamps.TimestampsService;
import systems.dmx.workspaces.WorkspacesService;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Document.OutputSettings;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

import javax.imageio.ImageIO;

import java.awt.image.BufferedImage;
import java.io.File;
import java.io.IOException;
import java.net.URL;
// import java.text.DateFormat;
// import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;
import java.util.logging.Logger;
import java.util.stream.Collectors;



public class EmailDigests {

    // ------------------------------------------------------------------------------------------------------- Constants

    static final String DIGEST_EMAIL_SUBJECT = System.getProperty("dmx.linqa.digest_email_subject", "Linqa Platform");
    static final int DIGEST_EMAIL_HOUR = Integer.getInteger("dmx.linqa.digest_email_hour", 6);      // default is 6am
    static final String HOST_URL = System.getProperty("dmx.host.url", "");

    static final long MILLISECS_PER_DAY = 1000 * 60 * 60 * 24;

    // static final DateFormat DATE_FORMAT = new SimpleDateFormat("MMM d, yyyy HH:mm:ss z");

    // ---------------------------------------------------------------------------------------------- Instance Variables

    private CoreService dmx;
    private AccessControlService acs;
    private WorkspacesService ws;
    private TimestampsService timestamps;
    private SendmailService sendmail;
    private SignupService signup;
    private String emailTemplate;
    private String commentTemplate;
    private StringProvider sp;
    private String lang1;
    private String lang2;

    private int digestCount;        // manipulated from lambda, so we make it a field (instead a local variable)

    private Logger logger = Logger.getLogger(getClass().getName());

    // ---------------------------------------------------------------------------------------------------- Constructors

    EmailDigests(CoreService dmx, AccessControlService acs, WorkspacesService ws, TimestampsService timestamps,
                 SendmailService sendmail, SignupService signup, String emailTemplate, String commentTemplate,
                 StringProvider sp, String lang1, String lang2) {
        this.dmx = dmx;
        this.acs = acs;
        this.ws = ws;
        this.timestamps = timestamps;
        this.sendmail = sendmail;
        this.signup = signup;
        this.emailTemplate = emailTemplate;
        this.commentTemplate = commentTemplate;
        this.sp = sp;
        this.lang1 = lang1;
        this.lang2 = lang2;
    }

    // ----------------------------------------------------------------------------------------- Package Private Methods

    // Digests are emailed every morning at 6am (by default, is configurable).
    // Note: if the Linqa plugin is deployed after 6am, the first digests are sent right away.
    void startTimedTask() {
        Calendar cal = new GregorianCalendar();
        cal.set(Calendar.HOUR_OF_DAY, DIGEST_EMAIL_HOUR);
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        logger.info(String.format("### Sheduling email-digests task for daily execution at %d:00, first execution: %s",
            DIGEST_EMAIL_HOUR, cal.getTime()));
        new Timer().scheduleAtFixedRate(new TimerTask() {
            @Override
            public void run() {
                sendEmailDigests();
            }
        }, cal.getTime(), MILLISECS_PER_DAY);
    }

    // ------------------------------------------------------------------------------------------------- Private Methods

    private void sendEmailDigests() {
        try {
            long to = System.currentTimeMillis();
            digestCount = 0;
            timestamps.getTopicsByModificationTime(to - MILLISECS_PER_DAY, to).stream()
                .filter(this::isComment)
                .collect(Collectors.groupingBy(this::workspace))
                .forEach((workspaceId, comments) -> {
                    acs.getMemberships(workspaceId).forEach(username -> {
                        sendDigestToUser(username, comments, workspaceId);
                    });
                });
            if (digestCount == 0) {
                logger.info("### Sending email digests SKIPPED -- no new/changed comment in last 24 hours");
            }
        } catch (Exception e) {
            throw new RuntimeException("Sending email digests failed", e);
        }
    }

    /**
     * Filters the given comments for the given user (based on her notification-level preference) and sends a digest
     * email to the user. If however the filter-result is empty no email is sent.
     *
     * @param   workspaceId     the workspaces the comments are originating from.
     */
    private void sendDigestToUser(Topic username, List<Topic> comments, long workspaceId) {
        String _username = username.getSimpleValue().toString();
        String workspaceName = dmx.getTopic(workspaceId).getSimpleValue().toString();
        logger.info(String.format("###### Sending email digest to user \"%s\" (%d) of workspace \"%s\" (filtering %d " +
            "comments)", _username, username.getId(), workspaceName, comments.size()));
        String commentsHtml = commentsHtml(comments, username);
        if (!commentsHtml.isEmpty()) {
            String displayName = signup.getDisplayName(_username);
            NotificationLevel notificationLevel = NotificationLevel.get(username);
            String workspaceUrl = "/#/workspace/" + workspaceId;
            String userProfileUrl = "/#/login?profile=notifications";
            File file = getExternalResourceFile("digest-custom.css");
            String customCSS = file.exists() ? JavaUtils.readTextFile(file) : "";
            String header1 = sp.getString(lang1, "digest_mail.header", displayName, workspaceName);
            String header2 = sp.getString(lang2, "digest_mail.header", displayName, workspaceName);
            String footer1 = sp.getString(lang1, "digest_mail.footer", workspaceUrl, notificationLevel, userProfileUrl);
            String footer2 = sp.getString(lang2, "digest_mail.footer", workspaceUrl, notificationLevel, userProfileUrl);
            String subject = String.format("[%s] %s", DIGEST_EMAIL_SUBJECT, workspaceName);
            String digestHtml = String.format(emailTemplate, HOST_URL, customCSS, lang1, lang2, header1, header2,
                commentsHtml, footer1, footer2);
            sendmail.doEmailRecipient(subject, null, digestHtml, _username);
            digestCount++;
        } else {
            logger.info("--> Nothing to send for user \"" + _username + "\"");
        }
    }

    private String commentsHtml(List<Topic> comments, Topic username) {
        NotificationLevel notificationLevel = NotificationLevel.get(username);
        return comments.stream()
            .filter(comment -> commentFilter(comment, username, notificationLevel))
            .map(comment -> {
                timestamps.enrichWithTimestamps(comment);
                acs.enrichWithUserInfo(comment);
                return comment;
            })
            .sorted((c1, c2) -> {
                long d = c1.getModel().getChildTopics().getLong(MODIFIED)      // synthetic, so operate on model
                       - c2.getModel().getChildTopics().getLong(MODIFIED);     // synthetic, so operate on model
                return d < 0 ? -1 : d == 0 ? 0 : 1;
            })
            .reduce(
                new StringBuilder(),
                (builder, comment) -> builder.append(commentHtml(comment)),
                (builder1, builder2) -> builder1.append(builder2)
            )
            .toString();
    }

    private boolean commentFilter(Topic comment, Topic username, NotificationLevel notificationLevel) {
        logger.fine("### comment " + comment.getId());
        switch (notificationLevel) {
        case ALL:
            logger.fine("   ALL --> true");
            return true;
        case NONE:
            logger.fine("   NONE --> false");
            return false;
        case MENTIONED:
            String html = comment.getSimpleValue().toString();
            Document doc = Jsoup.parseBodyFragment(html);
            Elements mentions = doc.select("span.mention");
            for (Element mention : mentions) {
                long id = Long.parseLong(mention.dataset().get("id"));
                boolean match = id == username.getId() || id == -1;      // -1 is "all"
                logger.fine("   --> mention username " + id + ", match=" + match);
                if (match) {
                    return true;
                }
            }
            return false;
        default:
            throw new RuntimeException("Unexpected notification level: " + notificationLevel);
        }
    }

    private boolean isComment(Topic topic) {
        return topic.getTypeUri().equals(COMMENT);
    }

    private Long workspace(Topic comment) {
        return ws.getAssignedWorkspace(comment.getId()).getId();
    }

    private String commentHtml(Topic comment) {
        String comment1 = comment.getChildTopics().getString(COMMENT_TEXT + "#" + LANG1);
        String comment2 = comment.getChildTopics().getString(COMMENT_TEXT + "#" + LANG2, "");
        String username = comment.getModel().getChildTopics().getString(CREATOR);   // synthetic, so operate on model
        long modified = comment.getModel().getChildTopics().getLong(MODIFIED);      // synthetic, so operate on model
        String author = signup.getDisplayName(username);
        return String.format(commentTemplate, author, new Date(modified), transformImageTags(comment1),
                                                                          transformImageTags(comment2));
    }

    /**
     * Transforms all <img> elements contained in the given HTML by adding width="300" attribute.
     *
     * @return  the transformed HTML.
     */
    private String transformImageTags(String commentHtml) {
        try {
            Document doc = Jsoup.parseBodyFragment(commentHtml);
            OutputSettings settings = doc.outputSettings();
            settings.prettyPrint(false);    // default is true, adds line breaks
            Elements images = doc.select("img");
            for (Element image : images) {
                URL url = new URL(HOST_URL + image.attr("src"));      // FIXME: absolute URLs?
                if (getImageWidth(url) > 300) {
                    image.attr("width", "300");
                }
            }
            return doc.body().html();       // parseBodyFragment() creates an empty document, with head and body
        } catch (Exception e) {
            throw new RuntimeException("Transforming <img> tags failed, commentHtml=" + commentHtml);
        }
    }

    private int getImageWidth(URL url) throws IOException {
        BufferedImage image = ImageIO.read(url.openStream());    // throws IOException
        if (image == null) {
            throw new RuntimeException("Can't read/decode image from \"" + url + "\"");
        }
        return image.getWidth();
    }

    // TODO: copied from LinqaPlugin.java
    private File getExternalResourceFile(String path) {
        return new File(DMXUtils.getConfigDir() + "dmx-linqa/" + path);
    }

    // -------------------------------------------------------------------------------------------------- Nested Classes

    public enum NotificationLevel {

        ALL,
        MENTIONED,      // the default
        NONE;

        public static NotificationLevel get(Topic username) {
            // "Notification Level" is an optional DB prop
            return username.hasProperty(NOTIFICATION_LEVEL) ?
                fromString((String) username.getProperty(NOTIFICATION_LEVEL)) :
                MENTIONED;
        }

        public static String getAsString(Topic username) {
            return get(username).toString();
        }

        public static void set(Topic username, NotificationLevel notificationLevel) {
            username.setProperty(NOTIFICATION_LEVEL, notificationLevel.toString(), false);      // addToIndex=false
        }

        public static NotificationLevel fromString(String notificationLevel) {
            return valueOf(notificationLevel.toUpperCase());
        }

        /**
         * Returns the external representation as stored in DB.
         */
        @Override
        public String toString() {
            return name().toLowerCase();
        }
    }
}
