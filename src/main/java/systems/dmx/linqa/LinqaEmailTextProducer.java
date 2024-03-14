package systems.dmx.linqa;

import systems.dmx.core.service.Cookies;
import systems.dmx.signup.EmailTextProducer;
import systems.dmx.signup.configuration.SignUpConfigOptions;

import java.util.Locale;
import java.util.ResourceBundle;

public class LinqaEmailTextProducer implements EmailTextProducer {

    // ------------------------------------------------------------------------------------------------------- Constants

    private static final String HOST_URL = System.getProperty("dmx.host.url", "");

    // ---------------------------------------------------------------------------------------------- Instance Variables

    private StringProvider sp;

    // ---------------------------------------------------------------------------------------------------- Constructors

    LinqaEmailTextProducer(StringProvider sp) {
        this.sp = sp;
    }

    // -------------------------------------------------------------------------------------------------- Public Methods

    @Override
    public boolean isHtml() {
        return false;
    }

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
        return getString("new_password_mail.subject");
    }

    @Override
    public String getPasswordResetMailMessage(String addressee, String key) {
        String link = HOST_URL + "/#/new-password/" + addressee + "/" + key;
        long hours = SignUpConfigOptions.CONFIG_TOKEN_EXPIRATION_DURATION.toHours();
        return getString("new_password_mail.message", addressee, link, hours);
    }

    @Override
    public String getAccountCreationSystemEmailSubject() {
        // Note: admin mails are always English
        return "A new Linqa user has registered";
    }

    @Override
    public String getAccountCreationSystemEmailMessage(String username, String mailbox) {
        // Note: admin mails are always English
        return "\nA new Linqa user has registered.\n\nUsername: " + username + "\nEmail: " + mailbox;
    }

    // ------------------------------------------------------------------------------------------------- Private Methods

    private String getString(String key, Object... args) {
        String lang = Cookies.get().get("linqa_lang");
        return sp.getString(lang, key, args);
    }
}
