package disscount.shared;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

public final class AfterRollback {

    private static final Logger log = LoggerFactory.getLogger(AfterRollback.class);

    private AfterRollback() {}

    /**
     * Undoes work outside the database, such as a stored file, once the transaction did not commit. It also runs
     * when the commit's outcome is unknown, so the action must check in a new transaction that nothing points at
     * what it removes. Without a transaction there is nothing to roll back, so it does nothing.
     */
    public static void run(Runnable action) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) return;

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) safely(action);
            }
        });
    }

    private static void safely(Runnable action) {
        try {
            action.run();
        } catch (RuntimeException e) {
            log.warn("Cleanup after a rollback failed: {}", e.getMessage());
        }
    }
}
