package com.lifeadmin.api;

import java.time.Duration;
import java.util.Comparator;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.metrics.buffering.BufferingApplicationStartup;
import org.springframework.boot.context.metrics.buffering.StartupTimeline;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class LifeAdminApiApplication {

    private static final Logger log = LoggerFactory.getLogger(LifeAdminApiApplication.class);

    public static void main(String[] args) {
        SpringApplication application = new SpringApplication(LifeAdminApiApplication.class);
        BufferingApplicationStartup startup = new BufferingApplicationStartup(4096);
        application.setApplicationStartup(startup);
        application.run(args);

        logSlowStartupSteps(startup);
    }

    private static void logSlowStartupSteps(BufferingApplicationStartup startup) {
        StartupTimeline timeline = startup.getBufferedTimeline();
        var events = timeline.getEvents();

        log.info("STARTUP_DIAGNOSTICS recordedSteps={}", events.size());
        events.stream()
                .filter(event -> event.getDuration().toMillis() >= 100)
                .sorted(Comparator.comparing(StartupTimeline.TimelineEvent::getDuration).reversed())
                .limit(30)
                .forEach(event -> {
                    long startOffsetMs = Duration.between(
                            timeline.getStartTime(), event.getStartTime()).toMillis();
                    StringBuilder tags = new StringBuilder();
                    for (var tag : event.getStartupStep().getTags()) {
                        if (!tags.isEmpty()) {
                            tags.append(',');
                        }
                        tags.append(tag.getKey()).append('=').append(tag.getValue());
                    }
                    log.info(
                            "STARTUP_STEP name={} durationMs={} startOffsetMs={} tags={}",
                            event.getStartupStep().getName(),
                            event.getDuration().toMillis(),
                            startOffsetMs,
                            tags);
                });
    }
}
