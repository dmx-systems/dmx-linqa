package systems.dmx.linqa;

import systems.dmx.signup.EmailTextProducer;

public class LinqaEmailTextProducer implements EmailTextProducer {

    private static final String HOST_URL = System.getProperty("dmx.host.url", "");

    @Override
    public String getConfirmationActiveMailSubject() {
        return "TODO: getConfirmationActiveMailSubject()";
    }

    @Override
    public String getConfirmationActiveMailMessage(String username, String key) {
        return "TODO: getConfirmationActiveMailMessage(), username=\"" + username + "\", key=\"" + key + "\"";
    }

    @Override
    public String getConfirmationProceedMailSubject() {
        return "TODO: getConfirmationProceedMailSubject()";
    }

    @Override
    public String getUserConfirmationProceedMailMessage(String username, String key) {
        return "TODO: getUserConfirmationProceedMailMessage(), username=\"" + username + "\", key=\"" + key + "\"";
    }

    @Override
    public String getApiUsageRevokedMailSubject() {
        return "TODO: getApiUsageRevokedMailSubject()";
    }

    @Override
    public String getApiUsageRevokedMailText(String username) {
        return "TODO: getApiUsageRevokedMailText(), username=\"" + username + "\"";
    }

    @Override
    public String getAccountActiveEmailSubject() {
        return "TODO: getAccountActiveEmailSubject()";
    }

    @Override
    public String getAccountActiveEmailMessage(String username) {
        return "TODO: getAccountActiveEmailMessage(), username=\"" + username + "\"";
    }

    @Override
    public String getApiUsageRequestedSubject() {
        return "TODO: getApiUsageRequestedSubject()";
    }

    @Override
    public String getApiUsageRequestedMessage(String username) {
        return "TODO: getApiUsageRequestedMessage(), username=\"" + username + "\"";
    }

    @Override
    public String getPasswordResetMailSubject() {
        return "Reset your Linqa password";
    }

    @Override
    public String getPasswordResetMailMessage(String addressee, String key) {
        return "In order to enter a new password for " + addressee + " please click this link:<br>\n<br>\n" +
            HOST_URL + "#/new-password/" + addressee + "/" + key;
    }

    @Override
    public String getAccountCreationSystemEmailSubject() {
        return "A new Linqa user has registered";
    }

    @Override
    public String getAccountCreationSystemEmailMessage(String username, String mailbox) {
        return "A new Linqa user has registered.<br>\n<br>\nUsername: " + username + "<br>\nEmail: " + mailbox;
    }
}
