package com.lifeadmin.api.auth;

public interface PasswordResetEmailSender {

    boolean isConfigured();

    void send(String email, String displayName, String resetUrl);
}
