package com.lifeadmin.api.auth;

import java.util.Locale;
import java.util.Optional;

import com.lifeadmin.api.domain.User;
import com.lifeadmin.api.domain.UserRepository;
import com.lifeadmin.api.security.UserPrincipal;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final long SLOW_AUTH_THRESHOLD_NANOS = 500_000_000L;

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetService passwordResetService;

    public AuthService(
            UserRepository users,
            PasswordEncoder passwordEncoder,
            PasswordResetService passwordResetService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.passwordResetService = passwordResetService;
    }

    @Transactional
    public User register(String rawEmail, String rawPassword, String rawDisplayName, String rawTimezone) {
        String email = normalizeEmail(rawEmail);
        validatePassword(rawPassword);
        String displayName = normalizeDisplayName(rawDisplayName);
        String timezone = normalizeTimezone(rawTimezone);

        if (users.existsByEmail(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "An account with this email already exists");
        }

        return users.save(new User(
                email,
                passwordEncoder.encode(rawPassword),
                displayName,
                timezone));
    }

    @Transactional(readOnly = true)
    public User authenticate(String rawEmail, String rawPassword) {
        String email = normalizeEmail(rawEmail);
        String password = rawPassword == null ? "" : rawPassword;
        long totalStartedAt = System.nanoTime();

        long lookupStartedAt = System.nanoTime();
        Optional<User> foundUser = users.findByEmail(email);
        long lookupNanos = System.nanoTime() - lookupStartedAt;

        long passwordVerificationNanos = 0L;
        User authenticatedUser = null;
        if (foundUser.isPresent()) {
            User candidate = foundUser.get();
            long verificationStartedAt = System.nanoTime();
            boolean passwordMatches = passwordEncoder.matches(password, candidate.getPasswordHash());
            passwordVerificationNanos = System.nanoTime() - verificationStartedAt;
            if (passwordMatches) {
                authenticatedUser = candidate;
            }
        }

        long totalNanos = System.nanoTime() - totalStartedAt;
        if (totalNanos >= SLOW_AUTH_THRESHOLD_NANOS) {
            // Deliberately omit email, user ID, and password data from performance logs.
            log.warn(
                    "SLOW_AUTH lookupMs={} passwordVerificationMs={} totalMs={}",
                    lookupNanos / 1_000_000,
                    passwordVerificationNanos / 1_000_000,
                    totalNanos / 1_000_000);
        }

        if (authenticatedUser == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }
        return authenticatedUser;
    }

    @Transactional(readOnly = true)
    public User getCurrentUser(UserPrincipal principal) {
        return users.findById(principal.getId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    @Transactional
    public User completeOnboarding(UserPrincipal principal) {
        User user = getCurrentUser(principal);
        user.completeOnboarding();
        return user;
    }

    public void requestPasswordReset(String email) {
        passwordResetService.request(email);
    }

    public void confirmPasswordReset(String token, String password) {
        passwordResetService.confirm(token, password);
    }

    public UsernamePasswordAuthenticationToken authentication(User user) {
        return new UsernamePasswordAuthenticationToken(
                new UserPrincipal(user),
                null,
                java.util.List.of());
    }

    public AuthDtos.UserResponse response(User user) {
        return new AuthDtos.UserResponse(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getTimezone(),
                user.getOnboardingCompletedAt() != null,
                user.getCreatedAt());
    }

    private static String normalizeEmail(String value) {
        if (value == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email is required");
        }
        String email = value.trim().toLowerCase(Locale.ROOT);
        if (!email.matches("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$")) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Enter a valid email address");
        }
        return email;
    }

    private static String normalizeDisplayName(String value) {
        if (value == null || value.trim().length() < 2 || value.trim().length() > 120) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Name must be between 2 and 120 characters");
        }
        return value.trim();
    }

    private static String normalizeTimezone(String value) {
        if (value == null || value.isBlank() || value.length() > 64) {
            return "UTC";
        }
        return value.trim();
    }

    private static void validatePassword(String value) {
        if (value == null || value.length() < 12 || value.length() > 256) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST, "Password must be between 12 and 256 characters");
        }
    }
}
