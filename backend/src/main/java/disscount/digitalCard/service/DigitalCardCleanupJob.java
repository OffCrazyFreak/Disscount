package disscount.digitalCard.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import disscount.util.Timestamps;

@Component
@RequiredArgsConstructor
public class DigitalCardCleanupJob {

    static final int RETENTION_DAYS = 30;

    private static final Logger log = LoggerFactory.getLogger(DigitalCardCleanupJob.class);

    private final DigitalCardService cardService;
    private final PhotoUploadRateLimiter rateLimiter;

    @Scheduled(cron = "0 30 3 * * *", zone = "UTC")
    public void purgeDeletedCards() {
        int purged = cardService.purgeDeletedBefore(Timestamps.nowUtc().minusDays(RETENTION_DAYS));
        log.info("Purged {} soft-deleted digital cards", purged);
    }

    @Scheduled(fixedDelay = 300_000)
    public void sweepRateLimiter() {
        rateLimiter.sweep();
    }
}
