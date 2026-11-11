package disscount.user;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * One-shot data step (docs/AUTH.md, Soft delete): profiles deleted before the ledger existed get their tombstone,
 * and keep no username. Idempotent, so a second run changes nothing.
 */
@Component
@Profile(ErasureBackfillRunner.PROFILE)
@RequiredArgsConstructor
@Slf4j
class ErasureBackfillRunner implements ApplicationRunner {

    static final String PROFILE = "erasure-backfill";

    private final ErasureLedgerRepository erasureLedger;
    private final UserRepository users;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        int tombstoned = erasureLedger.tombstoneDeletedProfiles();
        int renamed = users.clearUsernamesOfDeletedProfiles();

        log.info("Erasure backfill: {} tombstones added, {} usernames cleared", tombstoned, renamed);
    }
}
