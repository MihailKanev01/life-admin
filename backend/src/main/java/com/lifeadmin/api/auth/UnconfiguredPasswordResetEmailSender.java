package com.lifeadmin.api.auth;

import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Component;

@Component
@ConditionalOnMissingBean(PasswordResetEmailSender.class)
public class UnconfiguredPasswordResetEmailSender implements PasswordResetEmailSender {

    @Override
    public void send(String email, String displayName, String resetUrl) {
        throw new IllegalStateException("Password reset email delivery is not configured");
    }
}
