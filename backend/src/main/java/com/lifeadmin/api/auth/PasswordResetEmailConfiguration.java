package com.lifeadmin.api.auth;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnClass;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

@Configuration
@ConditionalOnClass(JavaMailSender.class)
public class PasswordResetEmailConfiguration {

    @Bean
    PasswordResetEmailSender passwordResetEmailSender(
            ObjectProvider<JavaMailSender> mailSenderProvider,
            @Value("${life-admin.mail.from}") String from) {
        return (email, displayName, resetUrl) -> {
            JavaMailSender mailSender = mailSenderProvider.getIfAvailable();
            if (mailSender == null) {
                throw new IllegalStateException("Password reset email delivery is not configured");
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
        };
    }
}
