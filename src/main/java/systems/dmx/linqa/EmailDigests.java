package systems.dmx.linqa;

import static systems.dmx.accesscontrol.Constants.*;
import static systems.dmx.timestamps.Constants.*;
import static systems.dmx.linqa.Constants.*;

import systems.dmx.accesscontrol.AccessControlService;
import systems.dmx.core.Topic;
import systems.dmx.core.service.CoreService;
import systems.dmx.sendmail.SendmailService;
import systems.dmx.signup.SignupService;
import systems.dmx.timestamps.TimestampsService;
import systems.dmx.workspaces.WorkspacesService;

import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;

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

    private void sendDigestToUser(Topic username, List<Topic> comments, long workspaceId) {
        String _username = username.getSimpleValue().toString();
        NotificationLevel notificationLevel = NotificationLevel.get(username);
        String workspace = dmx.getTopic(workspaceId).getSimpleValue().toString();
        logger.info(String.format("###### Sending email digest to user \"%s\" (%d) of workspace \"%s\" (filtering %d " +
            "comments)", _username, username.getId(), workspace, comments.size()));
        String commentsHtml = comments.stream()
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
        if (!commentsHtml.isEmpty()) {
            String subject = String.format("[%s] %s", DIGEST_EMAIL_SUBJECT, workspace);
            String messageHtml = String.format(emailTemplate, "", "", commentsHtml, "", "");    // TODO
            sendmail.doEmailRecipient(subject, null, messageHtml, _username);
            digestCount++;
        } else {
            logger.info("--> Nothing to send for user \"" + _username + "\"");
        }
    }

    private boolean commentFilter(Topic comment, Topic username, NotificationLevel notificationLevel) {
        logger.info("### comment " + comment.getId());
        switch (notificationLevel) {
        case ALL:
            logger.info("   ALL --> true");
            return true;
        case NONE:
            logger.info("   NONE --> false");
            return false;
        case MENTIONED:
            String html = comment.getSimpleValue().toString();
            Document doc = Jsoup.parseBodyFragment(html);
            Elements mentions = doc.select("span.mention");
            for (Element mention : mentions) {
                long id = Long.parseLong(mention.dataset().get("id"));
                boolean match = id == username.getId() || id == -1;      // -1 is "all"
                logger.info("   --> mention username " + id + ", match=" + match);
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
        return String.format(commentTemplate, author, new Date(modified), comment1, comment2);
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
