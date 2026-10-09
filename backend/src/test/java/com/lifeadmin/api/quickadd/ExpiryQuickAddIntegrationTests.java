package com.lifeadmin.api.quickadd;

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
class ExpiryQuickAddIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void confirmsExpiryCaptureBySavingNoteAndReminderThirtyDaysBefore() throws Exception {
        MockHttpSession owner = register(email("expiry-existing"), "Expiry Owner");
        String thingId = createThing(owner, "Quick Add Mazda");

        mockMvc.perform(post("/api/v1/quick-add/expiry").with(csrf()).session(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request(thingId, null, "Vehicle", "Insurance", "2027-06-14", "2027-05-15")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.thingId").value(thingId))
                .andExpect(jsonPath("$.thingName").value("Quick Add Mazda"))
                .andExpect(jsonPath("$.thingCreated").value(false))
                .andExpect(jsonPath("$.expiresOn").value("2027-06-14"))
                .andExpect(jsonPath("$.reminderOn").value("2027-05-15"));

        mockMvc.perform(get("/api/v1/notes").param("thingId", thingId).session(owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].title").value("Insurance"))
                .andExpect(jsonPath("$.items[0].body")
                        .value("Expires on 2027-06-14. Reminder scheduled for 2027-05-15 (30 days before expiry)."));

        mockMvc.perform(get("/api/v1/reminders").session(owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].title").value("Insurance reminder"))
                .andExpect(jsonPath("$.items[0].thingId").value(thingId))
                .andExpect(jsonPath("$.items[0].dueDate").value("2027-05-15"));

        mockMvc.perform(get("/api/v1/search").param("q", "Insurance").session(owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[0].kind").value("NOTE"))
                .andExpect(jsonPath("$.items[1].kind").value("REMINDER"));
    }

    @Test
    void createsMissingThingAsPartOfTheConfirmedExpiryCapture() throws Exception {
        MockHttpSession owner = register(email("expiry-new-thing"), "New Thing Owner");

        mockMvc.perform(post("/api/v1/quick-add/expiry").with(csrf()).session(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request(null, "Quick Add Home", "Home", "Boiler service", "2027-06-14", "2027-05-15")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.thingName").value("Quick Add Home"))
                .andExpect(jsonPath("$.thingCreated").value(true));

        mockMvc.perform(get("/api/v1/things").session(owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].name").value("Quick Add Home"))
                .andExpect(jsonPath("$.items[0].type").value("Home"));
    }

    @Test
    void expiryCaptureChecksThingOwnershipAndReminderDate() throws Exception {
        MockHttpSession owner = register(email("expiry-owner"), "Owner");
        MockHttpSession other = register(email("expiry-other"), "Other");
        String thingId = createThing(owner, "Private expiry Thing");

        mockMvc.perform(post("/api/v1/quick-add/expiry").with(csrf()).session(other)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request(thingId, null, "Vehicle", "Insurance", "2027-06-14", "2027-05-15")))
                .andExpect(status().isNotFound());

        mockMvc.perform(post("/api/v1/quick-add/expiry").with(csrf()).session(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(request(thingId, null, "Vehicle", "Insurance", "2027-06-14", "2027-05-16")))
                .andExpect(status().isBadRequest());

        mockMvc.perform(get("/api/v1/notes").param("thingId", thingId).session(owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));
        mockMvc.perform(get("/api/v1/reminders").session(owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    private String createThing(MockHttpSession session, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/things").with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name":"%s","type":"Vehicle","detail":"Quick Add integration fixture"}
                            """.formatted(name)))
                .andExpect(status().isOk()).andReturn();
        return jsonField(result.getResponse().getContentAsString(), "id");
    }

    private MockHttpSession register(String email, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"email":"%s","password":"LifeAdmin-Test-2026!","displayName":"%s","timezone":"Europe/Sofia"}
                            """.formatted(email, name)))
                .andExpect(status().isOk()).andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }

    private static String request(String thingId, String thingName, String thingType,
                                  String recordTitle, String expiresOn, String reminderOn) {
        StringBuilder json = new StringBuilder("{\"recordTitle\":\"")
                .append(recordTitle)
                .append("\",\"expiresOn\":\"").append(expiresOn)
                .append("\",\"reminderOn\":\"").append(reminderOn).append("\"");
        if (thingId != null) json.append(",\"thingId\":\"").append(thingId).append("\"");
        if (thingName != null) json.append(",\"thingName\":\"").append(thingName).append("\"");
        if (thingType != null) json.append(",\"thingType\":\"").append(thingType).append("\"");
        return json.append("}").toString();
    }

    private static String jsonField(String json,String field) {
        String value=json.replaceAll(".*\\\"" + field + "\\\":\\\"([^\\\"]*)\\\".*", "$1");
        if(value.equals(json))throw new AssertionError("Missing JSON field " + field + " in " + json);
        return value;
    }

    private static String email(String prefix) {
        return prefix + "-" + UUID.randomUUID() + "@example.com";
    }
}
