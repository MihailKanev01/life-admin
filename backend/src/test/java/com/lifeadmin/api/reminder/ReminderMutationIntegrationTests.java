package com.lifeadmin.api.reminder;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import com.lifeadmin.api.thing.ThingRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class ReminderMutationIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void reminderCanBeUpdatedAndRescheduled() throws Exception {
        MockHttpSession session = session(register());

        MvcResult reminder = mockMvc.perform(post("/api/v1/reminders")
                        .with(csrf())
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"Car service",
                                  "context":"Mazda 6",
                                  "dueDate":"2027-10-14"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        String id = jsonField(reminder, "$.id");

        mockMvc.perform(patch("/api/v1/reminders/" + id)
                        .with(csrf())
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"Car service booked",
                                  "context":"Mazda 6",
                                  "dueDate":"2027-11-04",
                                  "thingId":null
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Car service booked"))
                .andExpect(jsonPath("$.dueDate").value("2027-11-04"));

        mockMvc.perform(post("/api/v1/reminders/" + id + "/reschedule")
                        .with(csrf())
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"dueDate":"2027-12-01"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dueDate").value("2027-12-01"));
    }

    @Test
    void reminderUpdateCannotUseAnotherUsersThing() throws Exception {
        MockHttpSession sessionA = session(register());
        MockHttpSession sessionB = session(register());

        MvcResult thing = mockMvc.perform(post("/api/v1/things")
                        .with(csrf())
                        .session(sessionB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Private Home",
                                  "type":"Home",
                                  "detail":"Private"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        String thingId = jsonField(thing, "$.id");

        MvcResult reminder = mockMvc.perform(post("/api/v1/reminders")
                        .with(csrf())
                        .session(sessionA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"Private reminder",
                                  "context":"Personal",
                                  "dueDate":"2027-10-14"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        String reminderId = jsonField(reminder, "$.id");

        mockMvc.perform(patch("/api/v1/reminders/" + reminderId)
                        .with(csrf())
                        .session(sessionA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"Updated",
                                  "context":"Personal",
                                  "dueDate":"2027-10-15",
                                  "thingId":"%s"
                                }
                                """.formatted(thingId)))
                .andExpect(status().isNotFound());
    }

    private MvcResult register() throws Exception {
        String email = "reminder-" + UUID.randomUUID() + "@example.com";
        return mockMvc.perform(post("/api/v1/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"%s",
                                  "password":"LifeAdmin-Test-2026!",
                                  "displayName":"Reminder User",
                                  "timezone":"Europe/Sofia"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();
    }

    private static MockHttpSession session(MvcResult result) {
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private static String jsonField(MvcResult result, String path) throws Exception {
        return com.jayway.jsonpath.JsonPath.read(result.getResponse().getContentAsString(), path);
    }
}
