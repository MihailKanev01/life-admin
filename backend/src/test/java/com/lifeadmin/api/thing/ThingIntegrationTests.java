package com.lifeadmin.api.thing;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ThingIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void thingsAreIsolatedByAuthenticatedUser() throws Exception {
        MockHttpSession sessionA = register(email("things-a"), "User A");
        MockHttpSession sessionB = register(email("things-b"), "User B");

        mockMvc.perform(post("/api/v1/things")
                        .with(csrf())
                        .session(sessionA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Mazda 6",
                                  "type":"Vehicle",
                                  "detail":"235,420 km"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Mazda 6"))
                .andExpect(jsonPath("$.openReminderCount").value(0));

        mockMvc.perform(get("/api/v1/things").session(sessionB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));

        mockMvc.perform(get("/api/v1/things").session(sessionA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].name").value("Mazda 6"));
    }

    @Test
    void duplicateThingNamesAreRejectedPerUser() throws Exception {
        MockHttpSession session = register(email("duplicate-thing"), "User");

        String body = """
                {
                  "name":"Mazda 6",
                  "type":"Vehicle",
                  "detail":"235,420 km"
                }
                """;

        mockMvc.perform(post("/api/v1/things")
                        .with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/things")
                        .with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void reminderCanBeLinkedOnlyToOwnThing() throws Exception {
        MockHttpSession sessionA = register(email("thing-owner-a"), "Owner A");
        MockHttpSession sessionB = register(email("thing-owner-b"), "Owner B");

        MvcResult created = mockMvc.perform(post("/api/v1/things")
                        .with(csrf()).session(sessionA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Mazda 6",
                                  "type":"Vehicle",
                                  "detail":"235,420 km"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        String responseBody = created.getResponse().getContentAsString();
        String id = responseBody.replaceAll(".*\\\"id\\\":\\\"([^\\\"]+)\\\".*", "$1");

        mockMvc.perform(post("/api/v1/reminders")
                        .with(csrf()).session(sessionB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"Insurance",
                                  "context":"Mazda 6",
                                  "dueDate":"2027-12-14",
                                  "thingId":"%s"
                                }
                                """.formatted(id)))
                .andExpect(status().isNotFound());
    }

    private MockHttpSession register(String email, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
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
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private static String email(String prefix) {
        return prefix + "-" + UUID.randomUUID() + "@example.com";
    }
}
