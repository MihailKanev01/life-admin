package com.lifeadmin.api.auth;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import com.lifeadmin.api.auth.PasswordResetEmailSender;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthLifecycleIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void registrationRemainsPublicAfterLogout() throws Exception {
        String email = "lifecycle-" + java.util.UUID.randomUUID() + "@example.com";

        MvcResult registration = mockMvc.perform(post("/api/v1/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"%s",
                                  "password":"LifeAdmin-Test-2026!",
                                  "displayName":"Lifecycle User",
                                  "timezone":"Europe/Sofia"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();

        MockHttpSession session = (MockHttpSession) registration.getRequest().getSession(false);

        mockMvc.perform(post("/api/v1/auth/logout")
                        .with(session)
                        .with(csrf()))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/register")
                        .with(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"%s",
                                  "password":"LifeAdmin-Test-2026!",
                                  "displayName":"Lifecycle User",
                                  "timezone":"Europe/Sofia"
                                }
                                """.formatted(email)))
                .andExpect(status().isConflict());
    }

    @TestConfiguration
    static class TestMailConfiguration {

        @Bean(name = "lifecyclePasswordResetEmailSender")
        @Primary
        PasswordResetEmailSender passwordResetEmailSender() {
            return (email, displayName, resetUrl) -> {};
        }
    }
}
