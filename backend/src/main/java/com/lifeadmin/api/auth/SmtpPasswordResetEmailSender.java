package com.lifeadmin.api.auth;

import org.springframework.boot.autoconfigure.condition.ConditionalOnBean;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnBean(JavaMailSender.class)
public class SmtpPasswordResetEmailSender implements PasswordResetEmailSender {

    private final JavaMailSender mailSender;
    private final String from;

    public SmtpPasswordResetEmailSender(
            JavaMailSender mailSender,
            @Value("${life-admin.mail.from}") String from) {
        this.mailSender = mailSender;
        this.from = from;
    }

    @Override
    public void send(String email, String displayName, String resetUrl) {
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
}
