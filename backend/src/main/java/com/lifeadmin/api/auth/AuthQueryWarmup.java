package com.lifeadmin.api.auth;

import com.lifeadmin.api.domain.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Warms the read-only user lookup used during login before the service is marked ready.
 * The reserved .invalid address cannot be a real account and no authentication or writes occur.
 */
@Component
@Profile("!test")
@Order(Ordered.HIGHEST_PRECEDENCE)
public class AuthQueryWarmup implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AuthQueryWarmup.class);
    private static final String WARMUP_EMAIL = "life-admin-production-check@example.invalid";
    private static final int WARMUP_ATTEMPTS = 3;

    private final UserRepository users;

    public AuthQueryWarmup(UserRepository users) {
        this.users = users;
    }

    @Override
    @Transactional(readOnly = true)
    public void run(ApplicationArguments args) {
        long startedAt = System.nanoTime();
        try {
            for (int attempt = 1; attempt <= WARMUP_ATTEMPTS; attempt++) {
                users.findByEmail(WARMUP_EMAIL);
            }
            log.info(
                    "AUTH_LOOKUP_WARMUP complete attempts={} durationMs={}",
                    WARMUP_ATTEMPTS,
                    (System.nanoTime() - startedAt) / 1_000_000);
        } catch (RuntimeException exception) {
            // Warm-up must never prevent the API from starting; the normal login path remains authoritative.
            log.warn(
                    "AUTH_LOOKUP_WARMUP skipped after {}ms; errorType={}",
                    (System.nanoTime() - startedAt) / 1_000_000,
                    exception.getClass().getSimpleName());
        }
    }
}
