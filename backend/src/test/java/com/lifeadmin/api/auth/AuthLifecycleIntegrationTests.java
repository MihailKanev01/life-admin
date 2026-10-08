package com.lifeadmin.api.auth;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthLifecycleIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void registrationRemainsPublicAfterLogout() throws Exception {
        String email = "lifecycle-" + UUID.randomUUID() + "@example.com";

        MvcResult registration = mockMvc.perform(post("/api/v1/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"LifeAdmin-Test-2026!","displayName":"Lifecycle User","timezone":"Europe/Sofia"}
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();

        MockHttpSession session = (MockHttpSession) registration.getRequest().getSession(false);

        mockMvc.perform(post("/api/v1/auth/logout")
                        .session(session)
                        .with(csrf()))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/auth/register")
                        .session(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"LifeAdmin-Test-2026!","displayName":"Lifecycle User","timezone":"Europe/Sofia"}
                                """.formatted(email)))
                .andExpect(status().isConflict());
    }
}
