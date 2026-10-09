package com.lifeadmin.api.notification;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.UUID;

import com.lifeadmin.api.domain.User;
import com.lifeadmin.api.domain.UserRepository;
import com.lifeadmin.api.reminder.Reminder;
import com.lifeadmin.api.reminder.ReminderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class NotificationDeliveryWorker {

    private static final LocalTime DELIVERY_TIME = LocalTime.of(9, 0);
    private final ReminderNotificationRepository notifications;
    private final ReminderRepository reminders;
    private final UserRepository users;
    private final NotificationEmailSender emailSender;

    public NotificationDeliveryWorker(
            ReminderNotificationRepository notifications,
            ReminderRepository reminders,
            UserRepository users,
            NotificationEmailSender emailSender) {
        this.notifications = notifications;
        this.reminders = reminders;
        this.users = users;
        this.emailSender = emailSender;
    }

    @Transactional
    public boolean deliverIfDue(UUID notificationId, Instant now) {
        ReminderNotification notification = notifications.findByIdForUpdate(notificationId).orElse(null);
        if (notification == null
                || !ReminderNotification.SCHEDULED.equals(notification.getStatus())
                || notification.getNextAttemptAt().isAfter(now)) {
            return false;
        }

        Reminder reminder = reminders.findByIdAndUserId(
                        notification.getReminderId(), notification.getUserId())
                .orElse(null);
        if (reminder == null
                || !"OPEN".equals(reminder.getStatus())
                || reminder.getDueDate() == null) {
            notification.cancel(now);
            return true;
        }

        User user = users.findById(notification.getUserId()).orElse(null);
        if (user == null) {
            notification.cancel(now);
            return true;
        }

        ZoneId zone = NotificationTime.zoneOrUtc(user.getTimezone());
        Instant expectedSchedule = reminder.getDueDate()
                .minusDays(notification.getDaysBeforeDue())
                .atTime(DELIVERY_TIME)
                .atZone(zone)
                .toInstant();

        // A stale schedule can remain after an older version of the app reschedules a reminder.
        // Drop it rather than sending a late or duplicate notification.
        if (!expectedSchedule.equals(notification.getScheduledAt())
                || now.isAfter(notification.getScheduledAt().plus(Duration.ofHours(24)))) {
            notification.cancel(now);
            return true;
        }

        if (!ReminderNotification.EMAIL.equals(notification.getChannel())) {
            notification.recordFailure(now, "UNSUPPORTED_CHANNEL");
            return true;
        }

        try {
            emailSender.sendReminder(
                    user.getEmail(),
                    user.getDisplayName(),
                    reminder.getTitle(),
                    reminder.getContext(),
                    reminder.getDueDate(),
                    notification.getDaysBeforeDue());
            notification.markSent(now);
        } catch (Exception exception) {
            // Persist only the exception class; provider messages can contain addresses or payload data.
            notification.recordFailure(now, exception.getClass().getSimpleName());
        }
        return true;
    }
}
