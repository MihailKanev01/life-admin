package com.lifeadmin.api.auth;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import com.lifeadmin.api.domain.UserRepository;
import com.lifeadmin.api.reminder.Reminder;
import com.lifeadmin.api.reminder.ReminderRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.test.context.support.WithAnonymousUser;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AuthAndReminderIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository users;

    @Autowired
    private ReminderRepository reminders;

    @Test
    void registerCreatesAuthenticatedSessionAndOnboardingCanBeCompleted() throws Exception {
        String email = email("onboarding");

        MvcResult register = mockMvc.perform(post("/api/v1/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"%s",
                                  "password":"LifeAdmin-Test-2026!",
                                  "displayName":"Test User",
                                  "timezone":"Europe/Sofia"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(email))
                .andExpect(jsonPath("$.user.onboardingComplete").value(false))
                .andReturn();

        MockHttpSession session = (MockHttpSession) register.getRequest().getSession(false);
        org.junit.jupiter.api.Assertions.assertNotNull(session);

        mockMvc.perform(get("/api/v1/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.email").value(email));

        mockMvc.perform(patch("/api/v1/auth/me/onboarding")
                        .with(csrf())
                        .session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.onboardingComplete").value(true));

        mockMvc.perform(get("/api/v1/auth/me").session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.onboardingComplete").value(true));
    }

    @Test
    @WithAnonymousUser
    void remindersRequireAuthentication() throws Exception {
        mockMvc.perform(get("/api/v1/reminders"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void remindersAreIsolatedByAuthenticatedUser() throws Exception {
        String emailA = email("a");
        String emailB = email("b");

        MvcResult registerA = register(emailA, "User A");
        MockHttpSession sessionA = session(registerA);

        mockMvc.perform(post("/api/v1/reminders")
                        .with(csrf())
                        .session(sessionA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"Passport renewal",
                                  "context":"Personal",
                                  "dueDate":"2027-09-22"
                                }
                                """))
                .andExpect(status().isOk());

        MvcResult registerB = register(emailB, "User B");
        MockHttpSession sessionB = session(registerB);

        mockMvc.perform(get("/api/v1/reminders").session(sessionB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.items.length()").value(0));

        mockMvc.perform(get("/api/v1/reminders").session(sessionA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].title").value("Passport renewal"));
    }

    @Test
    void duplicateEmailIsRejected() throws Exception {
        String email = email("duplicate");
        register(email, "Original");

        mockMvc.perform(post("/api/v1/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"%s",
                                  "password":"LifeAdmin-Test-2026!",
                                  "displayName":"Duplicate",
                                  "timezone":"Europe/Sofia"
                                }
                                """.formatted(email)))
                .andExpect(status().isConflict());
    }

    private MvcResult register(String email, String name) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"%s",
                                  "password":"LifeAdmin-Test-2026!",
                                  "displayName":"%s",
                                  "timezone":"Europe/Sofia"
                                }
                                """.formatted(email, name)))
                .andExpect(status().isOk())
                .andReturn();
    }

    private static MockHttpSession session(MvcResult result) {
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private static String email(String prefix) {
        return prefix + "-" + UUID.randomUUID() + "@example.com";
    }
}
