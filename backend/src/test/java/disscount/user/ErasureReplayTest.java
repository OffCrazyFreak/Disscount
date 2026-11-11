package disscount.user;

import disscount.support.FullStackTest;
import disscount.support.IncludingDeleted;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.HexFormat;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ErasureReplayTest extends FullStackTest {

    private static final byte[] KEY = HexFormat.of().parseHex("b".repeat(64));

    @Autowired ErasureReplay replay;
    @Autowired ErasureLedgerRepository erasureLedger;

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
        verify(authIdentityDao).deleteById(erased.getId());

        assertThat(users.findById(kept.getId()).orElseThrow().getDeletedAt()).isNull();
        verify(authIdentityDao, never()).deleteById(kept.getId());
    }

    // An account erased after the dump may never have made a request, so only its login exists.
    @Test
    void aLoginWithoutAProfileIsStillErased() {
        UUID loginOnly = UUID.randomUUID();
        when(authIdentityDao.findAllIds()).thenReturn(List.of(loginOnly));

        assertThat(replay.replay(KEY, Set.of(markerOf(loginOnly)))).isEqualTo(1);

        assertThat(erasureLedger.findById(loginOnly)).isPresent();
        verify(authIdentityDao).deleteById(loginOnly);
    }

    // A marker made with another key, or for another id, must never erase anyone.
    @Test
    void aMarkerFromAnotherKeyMatchesNobody() {
        User user = newUser("other-key");
        when(authIdentityDao.findAllIds()).thenReturn(List.of(user.getId()));
        String foreign = ErasureMarkers.name(HexFormat.of().parseHex("c".repeat(64)), "account", user.getId());

        assertThat(replay.replay(KEY, Set.of(foreign))).isZero();

        assertThat(users.findById(user.getId()).orElseThrow().getDeletedAt()).isNull();
        verify(authIdentityDao, never()).deleteById(any());
    }
}
