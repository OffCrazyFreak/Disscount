package disscount.contactMessage.service;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import disscount.exceptions.TooManyRequestsException;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.time.Clock;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Iterator;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Sliding hour and day windows per client IP for the public contact form. In memory, like
 * the photo upload limiter: one backend instance, and a deploy resetting it costs little.
 */
@Component
public class ContactRateLimiter {

    static final int MAX_PER_HOUR = 5;
    static final int MAX_PER_DAY = 20;
    static final long HOUR_MILLIS = 3_600_000;
    static final long DAY_MILLIS = 86_400_000;

    // Accepted send times per IP, oldest first; never more than MAX_PER_DAY entries.
    private final ConcurrentHashMap<String, Deque<Long>> sends = new ConcurrentHashMap<>();
    private final Clock clock;

    public ContactRateLimiter() {
        this(Clock.systemUTC());
    }

    ContactRateLimiter(Clock clock) {
        this.clock = clock;
    }

    public void check(String clientIp) {
        long now = clock.millis();
        long[] retryAfterMillis = {0};

        sends.compute(bucketKey(clientIp), (key, times) -> {
            Deque<Long> recent = times == null ? new ArrayDeque<>() : times;
            dropOlderThanADay(recent, now);
            retryAfterMillis[0] = retryAfterMillis(recent, now);
            if (retryAfterMillis[0] == 0) {
                recent.addLast(now);
            }
            return recent;
        });

        if (retryAfterMillis[0] > 0) {
            long seconds = Math.max(1, (retryAfterMillis[0] + 999) / 1000);
            throw new TooManyRequestsException("error.contactMessage.rateLimited", seconds);
        }
    }

    /**
     * IPv6 visitors usually hold a whole /64 (Hetzner hands one to every server), so one
     * bucket per /64, as better-auth does; otherwise each message could use a fresh address.
     */
    static String bucketKey(String clientIp) {
        if (!clientIp.contains(":")) {
            return clientIp;
        }
        try {
            // ClientIp only returns literals, so this parses without a DNS lookup.
            InetAddress address = InetAddress.getByName(clientIp);
            byte[] bytes = address.getAddress();
            if (bytes.length != 16) {
                // Java parses ::ffff:a.b.c.d as plain IPv4.
                return address.getHostAddress();
            }
            StringBuilder prefix = new StringBuilder();
            for (int i = 0; i < 8; i += 2) {
                prefix.append(String.format("%02x%02x:", bytes[i], bytes[i + 1]));
            }
            return prefix.append(":/64").toString();
        } catch (UnknownHostException malformed) {
            return clientIp;
        }
    }

    private static long retryAfterMillis(Deque<Long> recent, long now) {
        if (recent.size() >= MAX_PER_DAY) {
            return recent.peekFirst() + DAY_MILLIS - now;
        }

        int inLastHour = 0;
        long oldestInHour = 0;
        Iterator<Long> newestFirst = recent.descendingIterator();
        while (newestFirst.hasNext()) {
            long sentAt = newestFirst.next();
            if (now - sentAt >= HOUR_MILLIS) {
                break;
            }
            inLastHour++;
            oldestInHour = sentAt;
        }

        return inLastHour >= MAX_PER_HOUR ? oldestInHour + HOUR_MILLIS - now : 0;
    }

    private static void dropOlderThanADay(Deque<Long> recent, long now) {
        while (!recent.isEmpty() && now - recent.peekFirst() >= DAY_MILLIS) {
            recent.pollFirst();
        }
    }

    @Scheduled(fixedDelay = 3_600_000)
    public void sweep() {
        long now = clock.millis();
        for (String ip : sends.keySet()) {
            sends.computeIfPresent(ip, (key, recent) -> {
                dropOlderThanADay(recent, now);
                return recent.isEmpty() ? null : recent;
            });
        }
    }

    int trackedClients() {
        return sends.size();
    }
}
