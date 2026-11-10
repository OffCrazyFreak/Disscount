package disscount.user;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.LinkedHashSet;
import java.util.Set;
import java.util.UUID;

/** The markers come from the backup bucket, because the database being restored cannot hold them. */
@Service
@RequiredArgsConstructor
public class ErasureReplay {

    private final AuthIdentityDao authIdentities;
    private final UserRepository users;
    private final AccountErasureService accountErasure;

    public int replay(byte[] key, Set<String> markers) {
        // An identity can exist without a profile, and a profile can outlive its identity.
        Set<UUID> restored = new LinkedHashSet<>(authIdentities.findAllIds());
        restored.addAll(users.findActiveIds());

        int erased = 0;
        for (UUID id : restored) {
            if (!markers.contains(ErasureMarkers.name(key, ErasureLedgerEntry.ACCOUNT, id))) continue;

            accountErasure.erase(id);
            // better-auth deletes the identity once the erasure commits, so the replay does the same.
            authIdentities.deleteById(id);
            erased++;
        }
        return erased;
    }
}
