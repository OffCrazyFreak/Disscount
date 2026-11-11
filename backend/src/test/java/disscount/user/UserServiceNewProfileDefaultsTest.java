package disscount.user;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.context.ApplicationEventPublisher;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class UserServiceNewProfileDefaultsTest {

    private final UserRepository userRepository = mock(UserRepository.class);
    private final UserProfileCreator profileCreator = mock(UserProfileCreator.class);
    private final UserService userService = new UserService(userRepository, mock(AuthIdentityDao.class),
            profileCreator, mock(ApplicationEventPublisher.class),
            mock(ErasureLedgerRepository.class), mock(AvatarSanitizer.class),
            mock(AdminAuditLog.class));

    @Test
    void newProfileStartsWithTheNewsletterOffAndTheOtherSwitchesOn() {
        UUID id = UUID.randomUUID();
        when(userRepository.findById(id)).thenReturn(Optional.empty());

        userService.ensureActiveProfile(id, "ana@example.com", "Ana", null);

        ArgumentCaptor<User> created = ArgumentCaptor.forClass(User.class);
        verify(profileCreator).create(created.capture());
        User profile = created.getValue();
        assertThat(profile.getNewsletterEnabledAt()).isNull();
        assertThat(profile.getNotificationsPushEnabledAt()).isNotNull();
        assertThat(profile.getNotificationsEmailEnabledAt()).isNotNull();
        assertThat(profile.getFeedbackContactEnabledAt()).isNotNull();
    }

    // The account erasure token carries no email, and must not provision a profile it is about to erase.
    @Test
    void aTokenWithoutEmailNeitherCreatesNorRevivesAProfile() {
        userService.ensureActiveProfile(UUID.randomUUID(), null, null, null);

        verifyNoInteractions(userRepository, profileCreator);
    }
}
