package disscount.user.service;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import disscount.user.dao.AuthIdentityDao;
import disscount.util.Timestamps;

import java.time.Duration;
import java.time.LocalDateTime;

/**
 * better-auth deletes an expired session only when its token comes back, so a device that never
 * returns would keep its row, address and user agent forever. The privacy policy promises no
 * session address older than 30 days.
 */
@Component
@RequiredArgsConstructor
public class SessionRetentionJob {

    // Matches the hourly cron below; a cron rather than a fixed delay, so frequent redeploys cannot postpone it.
    static final Duration SWEEP_INTERVAL = Duration.ofHours(1);

    // Subtracting one sweep keeps the promise even for a row created just after a sweep ran.
    static final Duration IP_ADDRESS_RETENTION = Duration.ofDays(30).minus(SWEEP_INTERVAL);

    // A request that loaded the session just before it expired still finishes against its row.
    static final Duration EXPIRED_GRACE = Duration.ofHours(1);

    private static final Logger log = LoggerFactory.getLogger(SessionRetentionJob.class);

    private final AuthIdentityDao authIdentityDao;

    @Scheduled(cron = "0 17 * * * *", zone = "UTC")
    @Transactional
    public void sweep() {
        LocalDateTime now = Timestamps.nowUtc();
        int deleted = authIdentityDao.deleteSessionsExpiredBefore(now.minus(EXPIRED_GRACE));
        int cleared = authIdentityDao.clearSessionIpAddressesCreatedBefore(now.minus(IP_ADDRESS_RETENTION));
        log.info("Deleted {} expired sessions, cleared the address on {} older ones", deleted, cleared);
    }
}
