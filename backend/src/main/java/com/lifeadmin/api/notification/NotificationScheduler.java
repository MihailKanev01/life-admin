package com.lifeadmin.api.notification;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class NotificationScheduler {

    private static final Logger log = LoggerFactory.getLogger(NotificationScheduler.class);
    private final NotificationService notifications;

    public NotificationScheduler(NotificationService notifications) {
        this.notifications = notifications;
    }

    @Scheduled(fixedDelayString = "${life-admin.notifications.fixed-delay-ms:60000}")
    public void deliverDueNotifications() {
        int processed = notifications.processDueNotifications();
        if (processed > 0) {
            log.info("Processed {} due reminder notification(s)", processed);
        }
    }
}
