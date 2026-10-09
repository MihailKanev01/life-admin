package com.lifeadmin.api.notification;

import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

import com.lifeadmin.api.domain.User;
import com.lifeadmin.api.domain.UserRepository;
import com.lifeadmin.api.reminder.Reminder;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationService {

    private static final int[] DAYS_BEFORE_DUE = {7, 2, 0};
    private static final LocalTime DELIVERY_TIME = LocalTime.of(9, 0);
    private static final int BATCH_SIZE = 100;

    private final ReminderNotificationRepository notifications;
    private final UserRepository users;
    private final NotificationDeliveryWorker deliveryWorker;

    public NotificationService(
            ReminderNotificationRepository notifications,
            UserRepository users,
            NotificationDeliveryWorker deliveryWorker) {
        this.notifications = notifications;
        this.users = users;
        this.deliveryWorker = deliveryWorker;
    }

    @Transactional
    public void scheduleForReminder(Reminder reminder) {
        cancelPendingForReminder(reminder.getId());
        if (!"OPEN".equals(reminder.getStatus()) || reminder.getDueDate() == null) return;

        User user = users.findById(reminder.getUserId()).orElse(null);
        if (user == null) return;
        ZoneId zone = NotificationTime.zoneOrUtc(user.getTimezone());
        Instant now = Instant.now();

        for (int daysBeforeDue : DAYS_BEFORE_DUE) {
            Instant scheduledAt = reminder.getDueDate()
                    .minusDays(daysBeforeDue)
                    .atTime(DELIVERY_TIME)
                    .atZone(zone)
                    .toInstant();
            if (scheduledAt.isAfter(now)) {
                notifications.save(new ReminderNotification(
                        reminder.getUserId(), reminder.getId(), daysBeforeDue, scheduledAt));
            }
        }
    }

    @Transactional
    public void cancelPendingForReminder(UUID reminderId) {
        Instant now = Instant.now();
        notifications.findByReminderIdAndStatus(reminderId, ReminderNotification.SCHEDULED)
                .forEach(notification -> notification.cancel(now));
    }

    public int processDueNotifications() {
        return processDueNotifications(Instant.now());
    }

    // Public overload keeps retry/delivery behaviour deterministic in integration tests.
    public int processDueNotifications(Instant now) {
        List<UUID> dueIds = notifications.findDueIds(
                ReminderNotification.SCHEDULED, now, PageRequest.of(0, BATCH_SIZE));
        int attempted = 0;
        for (UUID id : dueIds) {
            if (deliveryWorker.deliverIfDue(id, now)) attempted++;
        }
        return attempted;
    }
}
