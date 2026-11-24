package disscount.user.erasure;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import disscount.user.UserRepository;

/**
 * One-shot data step (docs/AUTH.md, Soft delete): profiles deleted before the ledger and the erasure listeners
 * existed get their tombstone, lose their name and avatar, and go through the full erasure.
 * Idempotent, so a second run changes nothing.
 */
@Component
@Profile(ErasureBackfillRunner.PROFILE)
@RequiredArgsConstructor
@Slf4j
class ErasureBackfillRunner implements ApplicationRunner {

    static final String PROFILE = "erasure-backfill";

    private final ErasureLedgerRepository erasureLedger;
    private final UserRepository users;
    private final AccountErasureService accountErasure;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        // Tombstones first, so the erasure keeps each account's own deletion time instead of stamping today.
        int tombstoned = erasureLedger.tombstoneDeletedProfiles();
        int scrubbed = users.clearNamesAndAvatarsOfDeletedProfiles();

        List<UUID> deleted = users.findDeletedProfileIds().stream().map(UUID::fromString).toList();
        deleted.forEach(accountErasure::erase);

        log.info("Erasure backfill: {} tombstones added, {} profiles scrubbed, {} accounts erased",
                tombstoned, scrubbed, deleted.size());
    }
}
