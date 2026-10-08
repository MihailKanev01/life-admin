package com.lifeadmin.api.auth;

public interface PasswordResetEmailSender {

    void send(String email, String displayName, String resetUrl);
}
