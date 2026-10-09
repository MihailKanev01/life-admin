package com.lifeadmin.api.notification;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

@Configuration
public class NotificationEmailConfiguration {

    @Bean
    NotificationEmailSender notificationEmailSender(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${life-admin.mail.from}") String from) {
        return (email, displayName, title, context, dueDate, daysBeforeDue) -> {
            JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
            if (mailSender == null) {
                throw new IllegalStateException("Reminder email delivery is not configured");
            }

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

            try {
                var message = mailSender.createMimeMessage();
                var helper = new MimeMessageHelper(message, "UTF-8");
                helper.setFrom(from);
                helper.setTo(email);
                helper.setSubject("Life Admin reminder: " + title);
                helper.setText(body, false);
                mailSender.send(message);
            } catch (Exception exception) {
                throw new IllegalStateException("Could not send reminder email", exception);
            }
        };
    }
}
