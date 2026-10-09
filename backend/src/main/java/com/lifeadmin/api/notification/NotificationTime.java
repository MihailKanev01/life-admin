package com.lifeadmin.api.notification;

import java.time.DateTimeException;
import java.time.ZoneId;
import java.time.ZoneOffset;

final class NotificationTime {

    private NotificationTime() {}

    static ZoneId zoneOrUtc(String timezone) {
        if (timezone == null || timezone.isBlank()) return ZoneOffset.UTC;
        try {
            return ZoneId.of(timezone);
        } catch (DateTimeException ignored) {
            return ZoneOffset.UTC;
        }
    }
}
