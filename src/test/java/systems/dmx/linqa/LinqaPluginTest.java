package systems.dmx.linqa;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import systems.dmx.accesscontrol.AccessControlService;
import systems.dmx.core.Topic;
import systems.dmx.core.service.CoreService;
import systems.dmx.core.service.ModelFactory;
import systems.dmx.deepl.DeepLService;
import systems.dmx.facets.FacetsService;
import systems.dmx.files.FilesService;
import systems.dmx.sendmail.SendmailService;
import systems.dmx.signup.SignupService;
import systems.dmx.timestamps.TimestampsService;
import systems.dmx.topicmaps.TopicmapsService;
import systems.dmx.workspaces.WorkspacesService;

import java.lang.reflect.Field;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.URL;
import java.util.Arrays;
import java.util.List;
import java.util.logging.Level;
import java.util.logging.Logger;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import org.osgi.framework.Bundle;

class LinqaPluginTest {

    private final CoreService dmx = mock();
    private final ModelFactory mf = mock();
    private final DeepLService deepls = mock();
    private final TimestampsService timestamps = mock();
    private final TopicmapsService tms = mock();
    private final WorkspacesService ws = mock();
    private final AccessControlService acs = mock();
    private final FacetsService facets = mock();
    private final FilesService files = mock();
    private final SignupService signup = mock();
    private final SendmailService sendmail = mock();
    private final Bundle bundle = mock();
    private final LinqaPlugin subject = new LinqaPlugin();

    private void set(Object o, String fieldName, Object value) throws NoSuchFieldException, IllegalAccessException {
        Field field = findField(LinqaPlugin.class, fieldName);
        field.setAccessible(true);
        field.set(o, value);
    }

    private Field findField(Class<?> clazz, String fieldName) {
        try {
            return clazz.getDeclaredField(fieldName);
        } catch (NoSuchFieldException e) {
            return findField(clazz.getSuperclass(), fieldName);
        }
    }

    @BeforeEach
    void beforeEach() throws Exception {
        // Silence logger during test
        Logger.getLogger(LinqaPlugin.class.getName()).setLevel(Level.OFF);
        URL url = mock();
        when(url.openStream()).thenReturn(stringAsInputStream("Hi!"));
        when(bundle.getResource(any())).thenReturn(url);
        // Manually injects mocks
        set(subject, "dmx", dmx);
        set(subject, "mf", mf);
        set(subject, "deepls", deepls);
        set(subject, "timestamps", timestamps);
        set(subject, "tms", tms);
        set(subject, "ws", ws);
        set(subject, "acs", acs);
        set(subject, "files", files);
        set(subject, "signup", signup);
        set(subject, "sendmail", sendmail);
        set(subject, "bundle", bundle);
    }

    private InputStream stringAsInputStream(String str) {
        return new ByteArrayInputStream(str.getBytes());
    }

    @Test
    @DisplayName("init() should set email text producer in Sign-Up service")
    void init_should_set_email_text_producer() {
        // given:
        doNothing().when(signup).setEmailTextProducer(any());

        // when:
        subject.init();

        // then:
        verify(signup).setEmailTextProducer(isA(LinqaEmailTextProducer.class));
    }

    @Test
    @DisplayName("init() should register itself as topicmap customizer in TopicMap service")
    void init_should_register_itself_as_topicmap_customizer() {
        // given:
        doNothing().when(tms).registerTopicmapCustomizer(any());

        // when:
        subject.init();

        // then:
        verify(tms).registerTopicmapCustomizer(subject);
    }

    @Test
    @DisplayName("shutdown() should unregister itself as topicmap customizer in TopicMap service")
    void shutdown_should_unregister_itself_as_topicmap_customizer() {
        // given:
        doNothing().when(tms).unregisterTopicmapCustomizer(any());

        // when:
        subject.shutdown();

        // then:
        verify(tms).unregisterTopicmapCustomizer(subject);
    }

    @Test
    @DisplayName("postLoginUser() should set user active")
    void postLoginUser_should_set_user_active() {
        // given:
        when(dmx.beginTx()).thenReturn(mock());

        Topic userNameTopic = mock();
        doNothing().when(userNameTopic).setProperty(any(), anyBoolean(), anyBoolean());

        when(acs.getUsernameTopic(any())).thenReturn(userNameTopic);

        String givenUsername = "someuser";

        // when:
        subject.postLoginUser(givenUsername);

        // then:
        verify(acs).getUsernameTopic(givenUsername);
        verify(userNameTopic).setProperty(Constants.USER_ACTIVE, true, false);
    }

    @Test
    @DisplayName("getAllUsers() should return the list of all users")
    void getAllUsers_should_return_list_of_all_users() {
        // given:
        List<Topic> allUsers = Arrays.asList(mock(), mock(), mock());
        when(dmx.getTopicsByType(any())).thenReturn(allUsers);

        // when:
        List<Topic> result = subject.getAllUsers();

        // then:
        assertThat(result).isEqualTo(allUsers);
        verify(dmx).getTopicsByType(systems.dmx.accesscontrol.Constants.USERNAME);
    }

    private static class TestException extends RuntimeException {
    }

    @Test
    @DisplayName("getAllUsers() should throw RuntimeException when operation fails")
    void getAllUsers_should_throw_runtimeexception() {
        // given:
        Exception exception = new TestException();
        when(dmx.getTopicsByType(any())).thenThrow(exception);

        // when/then:
        assertThatThrownBy(subject::getAllUsers)
                .isInstanceOf(RuntimeException.class)
                .hasCause(exception);
    }
}