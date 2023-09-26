package systems.dmx.linqa;

import systems.dmx.signup.EmailTextProducer;

public class LinqaEmailTextProducer implements EmailTextProducer {

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
        return "TODO: getPasswordResetMailSubject()";
    }

    @Override
    public String getPasswordResetMailMessage(String addressee, String key) {
        return "TODO: getPasswordResetMailMessage(), addressee=\"" + addressee + "\", key=\"" + key + "\"";
    }

    @Override
    public String getAccountCreationSystemEmailSubject() {
        return "TODO: getAccountCreationSystemEmailSubject()";
    }

    @Override
    public String getAccountCreationSystemEmailMessage(String username, String mailbox) {
        return "TODO: getAccountCreationSystemEmailMessage(), username=\"" + username + "\", mailbox=\"" + mailbox +
            "\"";
    }
}
