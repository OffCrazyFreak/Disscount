package disscount.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;

// Off for the one-shot erasure runs, so no job touches a restored database before it is replayed or runs next to a backfill.
@Configuration
@Profile("!erasure-replay & !erasure-backfill")
@EnableScheduling
class SchedulingConfig {}
