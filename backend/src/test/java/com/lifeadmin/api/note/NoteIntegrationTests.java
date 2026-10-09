package com.lifeadmin.api.note;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
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
class NoteIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void notesCanBeCreatedEditedListedDeletedAndFoundInSearch() throws Exception {
        MockHttpSession owner = register(email("notes-owner"), "Notes Owner");
        String thingId = createThing(owner, "Mazda for notes");

        MvcResult created = mockMvc.perform(post("/api/v1/notes")
                        .with(csrf())
                        .session(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(noteRequest("Insurance contact", "Call Allianz on 0800 123", thingId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Insurance contact"))
                .andExpect(jsonPath("$.thingName").value("Mazda for notes"))
                .andReturn();
        String noteId = jsonField(created.getResponse().getContentAsString(), "id");

        mockMvc.perform(get("/api/v1/notes").param("thingId", thingId).session(owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].body").value("Call Allianz on 0800 123"));

        mockMvc.perform(patch("/api/v1/notes/" + noteId)
                        .with(csrf())
                        .session(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"title":"Policy number","body":"Policy reference is POLICY-42"}
                            """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Policy number"))
                .andExpect(jsonPath("$.body").value("Policy reference is POLICY-42"));

        mockMvc.perform(get("/api/v1/search").param("q", "POLICY-42").session(owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].kind").value("NOTE"))
                .andExpect(jsonPath("$.items[0].title").value("Policy number"))
                .andExpect(jsonPath("$.items[0].thingId").value(thingId))
                .andExpect(jsonPath("$.items[0].subtitle").value("Policy reference is POLICY-42 · Mazda for notes"));

        mockMvc.perform(delete("/api/v1/notes/" + noteId).with(csrf()).session(owner))
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/notes").param("thingId", thingId).session(owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));
        mockMvc.perform(get("/api/v1/search").param("q", "POLICY-42").session(owner))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    @Test
    void notesArePrivateAndCannotBeLinkedToAnotherUsersThing() throws Exception {
        MockHttpSession owner = register(email("notes-private-owner"), "Owner");
        MockHttpSession other = register(email("notes-private-other"), "Other");
        String thingId = createThing(owner, "Private notes Thing");
        MvcResult created = mockMvc.perform(post("/api/v1/notes")
                        .with(csrf()).session(owner).contentType(MediaType.APPLICATION_JSON)
                        .content(noteRequest("Private note", "Do not expose this", thingId)))
                .andExpect(status().isOk()).andReturn();
        String noteId = jsonField(created.getResponse().getContentAsString(), "id");

        mockMvc.perform(get("/api/v1/notes").session(other))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items.length()").value(0));
        mockMvc.perform(get("/api/v1/search").param("q", "expose").session(other))
                .andExpect(status().isOk()).andExpect(jsonPath("$.items.length()").value(0));
        mockMvc.perform(patch("/api/v1/notes/" + noteId).with(csrf()).session(other)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"title":"Stolen","body":"Stolen"}
                            """))
                .andExpect(status().isNotFound());
        mockMvc.perform(delete("/api/v1/notes/" + noteId).with(csrf()).session(other))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/v1/notes").with(csrf()).session(other)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(noteRequest("Wrong owner", "Not allowed", thingId)))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/notes").param("thingId", thingId).session(other))
                .andExpect(status().isNotFound());
    }

    @Test
    void notesRequireUsefulTitleAndBody() throws Exception {
        MockHttpSession owner = register(email("notes-validation"), "Validation Owner");
        String thingId = createThing(owner, "Notes validation Thing");
        mockMvc.perform(post("/api/v1/notes").with(csrf()).session(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(noteRequest("   ", "Body", thingId)))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/api/v1/notes").with(csrf()).session(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(noteRequest("Title", "   ", thingId)))
                .andExpect(status().isBadRequest());
    }

    private String createThing(MockHttpSession session, String name) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/things").with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                            {"name":"%s","type":"Vehicle","detail":"notes integration fixture"}
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

    private static String noteRequest(String title, String body, String thingId) {
        return """
            {"title":"%s","body":"%s","thingId":"%s"}
            """.formatted(title, body, thingId);
    }

    private static String email(String prefix) {
        return prefix + "-" + UUID.randomUUID() + "@example.com";
    }

    private static String jsonField(String json, String field) {
        String value = json.replaceAll(".*\\\"" + field + "\\\":\\\"([^\\\"]*)\\\".*", "$1");
        if (value.equals(json)) throw new AssertionError("Missing JSON field " + field + " in " + json);
        return value;
    }
}
