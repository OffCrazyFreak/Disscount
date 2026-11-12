package disscount.user.avatar;

import lombok.RequiredArgsConstructor;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
class AvatarJobs {

    private final AvatarCleanupService cleanup;
    private final DataUriAvatarMove move;

    @Scheduled(fixedDelay = 900_000, initialDelay = 60_000)
    public void retryCleanup() {
        cleanup.retryPending();
    }

    // Runs by itself after a deploy, so production needs no manual step; batches until no data URI is left.
    @Scheduled(fixedDelay = 3_600_000, initialDelay = 5 * 60_000)
    public void moveDataUriAvatars() {
        int settled;
        do {
            settled = move.moveBatch();
        } while (settled > 0);
    }
}
