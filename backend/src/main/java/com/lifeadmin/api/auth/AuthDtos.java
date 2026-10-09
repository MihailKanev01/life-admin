package com.lifeadmin.api.auth;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public final class AuthDtos {

    private AuthDtos() {}

    public record RegisterRequest(
            @NotBlank @Email @Size(max = 320) String email,
            @NotBlank @Size(min = 12, max = 256) String password,
            @NotBlank @Size(min = 2, max = 120) String displayName,
            @Size(max = 64) String timezone) {}

    public record LoginRequest(
            @NotBlank @Email @Size(max = 320) String email,
            @NotBlank String password) {}

    public record UserResponse(
            UUID id,
            String email,
            String displayName,
            String timezone,
            boolean onboardingComplete,
            Instant createdAt) {}

    public record AuthResponse(UserResponse user) {}

    public record CsrfResponse(String token) {}

    public record PasswordResetRequest(
            @NotBlank @Email @Size(max = 320) String email) {}

    public record PasswordResetConfirmRequest(
            @NotBlank String token,
            @NotBlank @Size(min = 12, max = 256) String password) {}

    public record MessageResponse(String message) {}
}
