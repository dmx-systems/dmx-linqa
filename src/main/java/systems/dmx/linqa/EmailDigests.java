package systems.dmx.linqa;

import static systems.dmx.accesscontrol.Constants.*;
import static systems.dmx.timestamps.Constants.*;
import static systems.dmx.linqa.Constants.*;

import systems.dmx.accesscontrol.AccessControlService;
import systems.dmx.core.RelatedTopic;
import systems.dmx.core.Topic;
import systems.dmx.core.service.CoreService;
import systems.dmx.sendmail.SendmailService;
import systems.dmx.timestamps.TimestampsService;
import systems.dmx.workspaces.WorkspacesService;

// import java.text.DateFormat;
// import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.GregorianCalendar;
import java.util.List;
import java.util.Timer;
import java.util.TimerTask;
import java.util.function.Consumer;
import java.util.logging.Level;
import java.util.logging.Logger;
import java.util.stream.Collectors;



class EmailDigests {

    // ------------------------------------------------------------------------------------------------------- Constants

    static final String DIGEST_EMAIL_SUBJECT = System.getProperty("dmx.linqa.digest_email_subject", "Linqa Platform");

    static final long MILLISECS_PER_DAY = 1000 * 60 * 60 * 24;

    // static final DateFormat DATE_FORMAT = new SimpleDateFormat("MMM d, yyyy HH:mm:ss z");

    // ---------------------------------------------------------------------------------------------- Instance Variables

    private CoreService dmx;
    private AccessControlService acs;
    private WorkspacesService ws;
    private TimestampsService timestamps;
    private SendmailService sendmail;

    private Topic linqaAdminWs;
    private int digestCount;        // manipulated from lambda, so we make it a field (instead a local variable)

    private Logger logger = Logger.getLogger(getClass().getName());

    // ---------------------------------------------------------------------------------------------------- Constructors

    EmailDigests(CoreService dmx, AccessControlService acs, WorkspacesService ws, TimestampsService timestamps,
                 SendmailService sendmail, Topic linqaAdminWs) {
        this.dmx = dmx;
        this.acs = acs;
        this.ws = ws;
        this.timestamps = timestamps;
        this.sendmail = sendmail;
        this.linqaAdminWs = linqaAdminWs;
    }

    // ----------------------------------------------------------------------------------------- Package Private Methods

    // Digests are emailed every morning at 6am.
    // Note: if the Linqa plugin is deployed after 6am, the first digests are sent right away.
    void startTimedTask() {
        Calendar cal = new GregorianCalendar();
        cal.set(Calendar.HOUR_OF_DAY, 6);    // 6am
        cal.set(Calendar.MINUTE, 0);
        cal.set(Calendar.SECOND, 0);
        logger.info("### Sheduling email-digests task for daily execution at 6am, first execution: " + cal.getTime());
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
                    String workspace = dmx.getTopic(workspaceId).getSimpleValue().toString();
                    String subject = String.format("[%s] %s", DIGEST_EMAIL_SUBJECT, workspace);
                    StringBuilder message = new StringBuilder();
                    logger.info("### Sending email digest for workspace \"" + workspace + "\" (" + comments.size() +
                        " comments)");
                    comments.forEach(comment -> {
                        timestamps.enrichWithTimestamps(comment);
                        acs.enrichWithUserInfo(comment);
                    });
                    comments.sort((c1, c2) -> {
                        long d = c1.getModel().getChildTopics().getLong(MODIFIED)      // synthetic, so operate on model
                               - c2.getModel().getChildTopics().getLong(MODIFIED);     // synthetic, so operate on model
                        return d < 0 ? -1 : d == 0 ? 0 : 1;
                    });
                    comments.forEach(comment -> {
                        message.append(emailMessage(comment));
                    });
                    forEachLinqaAdmin(username -> {
                        sendmail.doEmailRecipient(subject, null, message.toString(), username);
                    });
                    digestCount++;
                });
            if (digestCount == 0) {
                logger.info("### Sending email digests SKIPPED -- no new/changed comment in last 24 hours");
            }
        } catch (Exception e) {
            throw new RuntimeException("Sending email digests failed", e);
        }
    }

    private boolean isComment(Topic topic) {
        return topic.getTypeUri().equals(COMMENT);
    }

    private Long workspace(Topic comment) {
        return ws.getAssignedWorkspace(comment.getId()).getId();
    }

    private String emailMessage(Topic comment) {
        String commentLang1 = comment.getChildTopics().getString(COMMENT_TEXT + "#" + LANG1);
        String commentLang2 = comment.getChildTopics().getString(COMMENT_TEXT + "#" + LANG2, "");
        String creator = comment.getModel().getChildTopics().getString(CREATOR);     // synthetic, so operate on model
        long modified  = comment.getModel().getChildTopics().getLong(MODIFIED);      // synthetic, so operate on model
        return "<br>\nAuthor: " + creator + "<br>\nDate: " + new Date(modified) + "<br><br>\n\n" +
            commentLang1 + "\n>>>\n" + commentLang2 + "\n\n------------------------------------------------<br>\n";
    }

    private void forEachLinqaAdmin(Consumer<String> consumer) {
        getLinqaAdmins().stream().forEach(username -> {
            consumer.accept(username.getSimpleValue().toString());
        });
    }

    // TODO: copied from LinqaPlugin.java
    private List<RelatedTopic> getLinqaAdmins() {
        return acs.getMemberships(linqaAdminWs.getId());
    }
}
