package com.lifeadmin.api.auth;

import java.util.Locale;

import com.lifeadmin.api.domain.User;
import com.lifeadmin.api.domain.UserRepository;
import com.lifeadmin.api.security.UserPrincipal;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthService {

    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
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

        return users.findByEmail(email)
                .filter(user -> passwordEncoder.matches(password, user.getPasswordHash()))
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Invalid email or password"));
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
