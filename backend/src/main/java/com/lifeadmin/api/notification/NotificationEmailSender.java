package com.lifeadmin.api.notification;

import java.time.LocalDate;

public interface NotificationEmailSender {

    void sendReminder(
            String email,
            String displayName,
            String title,
            String context,
            LocalDate dueDate,
            int daysBeforeDue);
}
