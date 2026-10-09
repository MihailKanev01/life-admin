package com.lifeadmin.api.auth;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class PasswordResetNotConfiguredIntegrationTests {
    @Autowired
    private MockMvc mockMvc;

    @DynamicPropertySource
    static void disableEmailDelivery(DynamicPropertyRegistry registry) {
        registry.add("RESEND_API_KEY", () -> "");
        registry.add("life-admin.mail.from", () -> "noreply@localhost");
    }

    @Test
    void resetReportsUnavailableWithoutRevealingWhetherTheAccountExists() throws Exception {
        String registeredEmail = "reset-unavailable-" + UUID.randomUUID() + "@example.com";
        String unknownEmail = "unknown-" + UUID.randomUUID() + "@example.com";
        mockMvc.perform(post("/api/v1/auth/register").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"LifeAdmin-Reset-Test-2026!","displayName":"Reset Test","timezone":"Europe/Sofia"}
                                """.formatted(registeredEmail)))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/auth/password-reset/request").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\"}".formatted(registeredEmail)))
                .andExpect(status().isServiceUnavailable());
        mockMvc.perform(post("/api/v1/auth/password-reset/request").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"%s\"}".formatted(unknownEmail)))
                .andExpect(status().isServiceUnavailable());
    }
}
