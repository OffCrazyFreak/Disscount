package disscount.user.erasure;

import disscount.support.FullStackTest;
import disscount.support.IncludingDeleted;
import disscount.user.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.ApplicationContext;

import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ErasureReplayTest extends FullStackTest {

    private static final byte[] KEY = HexFormat.of().parseHex("b".repeat(64));

    @Autowired AccountErasureService accountErasure;
    @Autowired ErasureLedgerRepository erasureLedger;
    @Autowired ApplicationContext context;

    // The better-auth tables are not in H2, so the replay's identity delete is a mock here too.
    private final ReplayIdentityDeletion identityDeletion = mock(ReplayIdentityDeletion.class);

    private ErasureReplay replay;

    @BeforeEach
    void buildTheReplayOutsideItsProfile() {
        replay = new ErasureReplay(authIdentityDao, users, accountErasure, identityDeletion);
    }

    private static String markerOf(UUID id) {
        return ErasureMarkers.name(KEY, "account", id);
    }

    @Test
    void aRestoredAccountWithAMarkerIsErasedAgainWithItsLogin() {
        User erased = newUser("erased");
        User kept = newUser("kept");
        when(authIdentityDao.findAllIds()).thenReturn(List.of(erased.getId(), kept.getId()));

        int count = replay.replay(KEY, Set.of(markerOf(erased.getId())));

        assertThat(count).isEqualTo(1);
        User profile = IncludingDeleted.find(entityManager, User.class, erased.getId()).orElseThrow();
        assertThat(profile.getDeletedAt()).isNotNull();
        assertThat(profile.getUsername()).isNull();
        assertThat(erasureLedger.findById(erased.getId())).isPresent();
        verify(identityDeletion).deleteById(erased.getId());

        assertThat(users.findById(kept.getId()).orElseThrow().getDeletedAt()).isNull();
        verify(identityDeletion, never()).deleteById(kept.getId());
    }

    // An account erased after the dump may never have made a request, so only its login exists.
    @Test
    void aLoginWithoutAProfileIsStillErased() {
        UUID loginOnly = UUID.randomUUID();
        when(authIdentityDao.findAllIds()).thenReturn(List.of(loginOnly));

        assertThat(replay.replay(KEY, Set.of(markerOf(loginOnly)))).isEqualTo(1);

        assertThat(erasureLedger.findById(loginOnly)).isPresent();
        verify(identityDeletion).deleteById(loginOnly);
    }

    // A marker made with another key, or for another id, must never erase anyone.
    @Test
    void aMarkerFromAnotherKeyMatchesNobody() {
        User user = newUser("other-key");
        when(authIdentityDao.findAllIds()).thenReturn(List.of(user.getId()));
        String foreign = ErasureMarkers.name(HexFormat.of().parseHex("c".repeat(64)), "account", user.getId());

        assertThat(replay.replay(KEY, Set.of(foreign))).isZero();

        assertThat(users.findById(user.getId()).orElseThrow().getDeletedAt()).isNull();
        verify(identityDeletion, never()).deleteById(any());
    }

    // R11 takes DELETE on the identity table away from the web runtime, so nothing there may hold a way to use it.
    @Test
    void theWebRuntimeHasNoWayToDeleteAnIdentity() {
        assertThat(context.getBeanNamesForType(ReplayIdentityDeletion.class)).isEmpty();
        assertThat(context.getBeanNamesForType(ErasureReplay.class)).isEmpty();
    }
}
