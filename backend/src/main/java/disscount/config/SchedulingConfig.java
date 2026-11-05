package disscount.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;

// Off for the one-shot erasure replay, so no job touches a restored database before it is replayed.
@Configuration
@Profile("!erasure-replay")
@EnableScheduling
public class SchedulingConfig {}
