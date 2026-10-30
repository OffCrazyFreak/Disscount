package disscount.digitalCard.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

final class AfterCommit {

    private static final Logger log = LoggerFactory.getLogger(AfterCommit.class);

    private AfterCommit() {}

    /**
     * Object storage is not transactional, so deletes wait for the commit: a rollback must not
     * leave rows pointing at objects that are gone. A failure only orphans an object, so it is
     * logged and never surfaced to the caller.
     */
    static void run(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            safely(action);
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                safely(action);
            }
        });
    }

    private static void safely(Runnable action) {
        try {
            action.run();
        } catch (RuntimeException e) {
            log.warn("Photo storage cleanup failed: {}", e.getMessage());
        }
    }
}
