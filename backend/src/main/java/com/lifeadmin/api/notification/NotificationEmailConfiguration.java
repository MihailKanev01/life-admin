package com.lifeadmin.api.notification;

import com.lifeadmin.api.email.ResendEmailClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class NotificationEmailConfiguration {
    @Bean
    NotificationEmailSender notificationEmailSender(ResendEmailClient emailClient) {
        return (email, displayName, title, context, dueDate, daysBeforeDue) -> {
            String timing = daysBeforeDue == 0
                    ? "is due today"
                    : "is due in " + daysBeforeDue + (daysBeforeDue == 1 ? " day" : " days");
            String body = """
                    Hi %s,

                    A reminder from Life Admin: %s for %s %s.

                    Due date: %s

                    You are receiving this because email reminders are part of your Life Admin workspace.

                    Life Admin
                    """.formatted(displayName, title, context, timing, dueDate);
            emailClient.send(email, "Life Admin reminder: " + title, body);
        };
    }
}
