package com.lifeadmin.api.auth;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

import com.lifeadmin.api.domain.User;
import com.lifeadmin.api.domain.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PasswordResetService {

    private static final Duration TOKEN_TTL = Duration.ofMinutes(30);
    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Logger LOGGER = LoggerFactory.getLogger(PasswordResetService.class);

    private final UserRepository users;
    private final PasswordResetTokenRepository tokens;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetEmailSender emailSender;
    private final String baseUrl;

    public PasswordResetService(
            UserRepository users,
            PasswordResetTokenRepository tokens,
            PasswordEncoder passwordEncoder,
            PasswordResetEmailSender emailSender,
            @Value("${life-admin.app.base-url}") String baseUrl) {
        this.users = users;
        this.tokens = tokens;
        this.passwordEncoder = passwordEncoder;
        this.emailSender = emailSender;
        this.baseUrl = baseUrl;
    }

    @Transactional
    public void request(String rawEmail) {
        String email = normalizeEmail(rawEmail);
        var userOptional = users.findByEmail(email);

        if (userOptional.isEmpty()) {
            return;
        }

        User user = userOptional.get();
        Instant now = Instant.now();

        for (PasswordResetToken token : tokens.findByUserIdAndUsedAtIsNull(user.getId())) {
            token.markUsed();
        }

        String rawToken = newToken();
        tokens.save(new PasswordResetToken(
                user,
                hash(rawToken),
                now.plus(TOKEN_TTL)));

        String resetUrl = buildResetUrl(rawToken);

        try {
            emailSender.send(user.getEmail(), user.getDisplayName(), resetUrl);
        } catch (RuntimeException exception) {
            LOGGER.error("Unable to deliver password reset email", exception);
        }
    }

    @Transactional
    public void confirm(String rawToken, String rawPassword) {
        String tokenValue = rawToken == null ? "" : rawToken.trim();
        if (tokenValue.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Reset link is invalid or has expired");
        }

        validatePassword(rawPassword);
        String tokenHash = hash(tokenValue);
        PasswordResetToken token = tokens.findByTokenHashAndUsedAtIsNull(tokenHash)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST, "Reset link is invalid or has expired"));

        if (!token.isActiveAt(Instant.now())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Reset link is invalid or has expired");
        }

        User user = token.getUser();
        user.changePassword(passwordEncoder.encode(rawPassword));
        token.markUsed();
    }

    private String buildResetUrl(String token) {
        String normalizedBase = baseUrl == null ? "" : baseUrl.trim();
        if (normalizedBase.endsWith("/")) {
            normalizedBase = normalizedBase.substring(0, normalizedBase.length() - 1);
        }
        return normalizedBase + "/reset-password?token="
                + java.net.URLEncoder.encode(token, StandardCharsets.UTF_8);
    }

    private static String newToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private static String hash(String token) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(token.getBytes(StandardCharsets.UTF_8)));
        } catch (Exception exception) {
            throw new IllegalStateException("Could not hash password reset token", exception);
        }
    }

    private static String normalizeEmail(String value) {
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        String email = value.trim().toLowerCase(Locale.ROOT);
        if (!email.matches("^[^\s@]+@[^\s@]+\.[^\s@]+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid email address");
        }
        return email;
    }

    private static void validatePassword(String value) {
        if (value == null || value.length() < 12 || value.length() > 256) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Password must be between 12 and 256 characters");
        }
    }
}
