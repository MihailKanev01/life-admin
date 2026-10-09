package com.lifeadmin.api.auth;

import com.lifeadmin.api.email.ResendEmailClient;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class PasswordResetEmailConfiguration {
    @Bean
    PasswordResetEmailSender passwordResetEmailSender(ResendEmailClient emailClient) {
        return new PasswordResetEmailSender() {
            @Override
            public boolean isConfigured() {
                return emailClient.isConfigured();
            }

            @Override
            public void send(String email, String displayName, String resetUrl) {
                String body = """
                        Hi %s,

                        We received a request to reset your Life Admin password.

                        Use this link to choose a new password:
                        %s

                        This link expires in 30 minutes and can only be used once.

                        If you did not request this, you can safely ignore this email.

                        Life Admin
                        """.formatted(displayName, resetUrl);
                emailClient.send(email, "Reset your Life Admin password", body);
            }
        };
    }
}
