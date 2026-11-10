package disscount.user;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import disscount.shared.Timestamps;

import java.time.Duration;
import java.time.LocalDateTime;

/** better-auth deletes an expired session only when its token returns; the policy promises 30 days for addresses. */
@Component
@RequiredArgsConstructor
public class SessionRetentionJob {

    // A day under the promised 30, so a missed sweep or a backend outage still clears the address in time.
    static final Duration IP_ADDRESS_RETENTION = Duration.ofDays(29);

    // A request that loaded the session just before it expired still finishes against its row.
    static final Duration EXPIRED_GRACE = Duration.ofHours(1);

    private static final Logger log = LoggerFactory.getLogger(SessionRetentionJob.class);

    private final AuthIdentityDao authIdentityDao;

    // A cron so redeploys cannot postpone it; the address goes first, so a failed delete cannot hold back the promise.
    @Scheduled(cron = "0 17 * * * *", zone = "UTC")
    public void sweep() {
        LocalDateTime now = Timestamps.nowUtc();
        int cleared = authIdentityDao.clearSessionIpAddressesCreatedBefore(now.minus(IP_ADDRESS_RETENTION));
        int deleted = authIdentityDao.deleteSessionsExpiredBefore(now.minus(EXPIRED_GRACE));
        log.info("Cleared the address on {} older sessions, deleted {} expired ones", cleared, deleted);
    }
}
