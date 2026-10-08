package com.lifeadmin.api.auth;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.net.URI;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import com.lifeadmin.api.domain.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PasswordResetIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository users;

    @Autowired
    private CapturingPasswordResetEmailSender emailSender;

    @Test
    void passwordResetChangesPasswordAndConsumesToken() throws Exception {
        String email = "reset-" + UUID.randomUUID() + "@example.com";
        String oldPassword = "LifeAdmin-Old-2026!";
        String newPassword = "LifeAdmin-New-2026!";

        mockMvc.perform(post("/api/v1/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"%s",
                                  "password":"%s",
                                  "displayName":"Reset User",
                                  "timezone":"Europe/Sofia"
                                }
                                """.formatted(email, oldPassword)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/password-reset/request")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value(
                        "If an account exists for that email, a password reset link will be sent."));

        String resetUrl = emailSender.lastUrl();
        assertTrue(resetUrl != null && resetUrl.startsWith("http://localhost:3000/reset-password?token="));

        String token = URLDecoder.decode(
                URI.create(resetUrl).getQuery().substring("token=".length()),
                StandardCharsets.UTF_8);

        mockMvc.perform(post("/api/v1/auth/password-reset/confirm")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "token":"%s",
                                  "password":"%s"
                                }
                                """.formatted(token, newPassword)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/password-reset/confirm")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "token":"%s",
                                  "password":"%s"
                                }
                                """.formatted(token, newPassword)))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/v1/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"%s",
                                  "password":"%s"
                                }
                                """.formatted(email, oldPassword)))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/v1/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"%s",
                                  "password":"%s"
                                }
                                """.formatted(email, newPassword)))
                .andExpect(status().isOk());
    }

    @TestConfiguration
    static class TestMailConfiguration {

        @Bean(name = "testPasswordResetEmailSender")
        @Primary
        CapturingPasswordResetEmailSender passwordResetEmailSender() {
            return new CapturingPasswordResetEmailSender();
        }
    }

    static class CapturingPasswordResetEmailSender implements PasswordResetEmailSender {

        private final AtomicReference<String> lastUrl = new AtomicReference<>();

        @Override
        public void send(String email, String displayName, String resetUrl) {
            lastUrl.set(resetUrl);
        }

        String lastUrl() {
            return lastUrl.get();
        }
    }
}
