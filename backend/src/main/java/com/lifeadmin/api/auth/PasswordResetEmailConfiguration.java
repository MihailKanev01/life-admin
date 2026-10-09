package com.lifeadmin.api.auth;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

@Configuration
public class PasswordResetEmailConfiguration {

    @Bean
    PasswordResetEmailSender passwordResetEmailSender(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${life-admin.mail.from}") String from,
            @Value("${spring.mail.host:}") String smtpHost) {
        return new PasswordResetEmailSender() {
            private JavaMailSender configuredMailSender() {
                if (smtpHost == null || smtpHost.isBlank()) {
                    return null;
                }
                return mailSenderProvider.getIfAvailable();
            }

            @Override
            public boolean isConfigured() {
                return configuredMailSender() != null;
            }

            @Override
            public void send(String email, String displayName, String resetUrl) {
                JavaMailSender mailSender = configuredMailSender();
                if (mailSender == null) {
                    throw new IllegalStateException(
                            "Password reset email delivery is not configured. Configure SPRING_MAIL_HOST and SMTP credentials.");
                }

                try {
                    var message = mailSender.createMimeMessage();
                    var helper = new MimeMessageHelper(message, "UTF-8");
                    helper.setFrom(from);
                    helper.setTo(email);
                    helper.setSubject("Reset your Life Admin password");
                    helper.setText("""
                            Hi %s,

                            We received a request to reset your Life Admin password.

                            Use this link to choose a new password:
                            %s

                            This link expires in 30 minutes and can only be used once.

                            If you did not request this, you can safely ignore this email.

                            Life Admin
                            """.formatted(displayName, resetUrl));
                    mailSender.send(message);
                } catch (Exception exception) {
                    throw new IllegalStateException("Could not send password reset email", exception);
                }
            }
        };
    }
}
