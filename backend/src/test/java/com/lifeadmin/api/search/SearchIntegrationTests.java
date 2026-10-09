package com.lifeadmin.api.search;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import com.lifeadmin.api.payment.PaymentRepository;
import com.lifeadmin.api.security.UserPrincipal;
import com.lifeadmin.api.thing.ThingRepository;
import com.lifeadmin.api.reminder.ReminderRepository;
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
class SearchIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void searchFindsThingsRemindersAndPayments() throws Exception {
        String email = email("search");

        MvcResult register = register(email, "Search User");
        MockHttpSession session = session(register);

        mockMvc.perform(post("/api/v1/things")
                        .with(csrf())
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Mazda Car",
                                  "type":"Vehicle",
                                  "detail":"Insurance and service"
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/reminders")
                        .with(csrf())
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title":"Car insurance renewal",
                                  "context":"Mazda Car",
                                  "dueDate":"2027-10-14"
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/payments")
                        .with(csrf())
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Car insurance",
                                  "type":"BILL",
                                  "amount":120.00,
                                  "currency":"EUR",
                                  "frequency":"YEARLY"
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/search")
                        .param("q", "car")
                        .session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(3))
                .andExpect(jsonPath("$.items[0].kind").value("PAYMENT"))
                .andExpect(jsonPath("$.items[0].title").value("Car insurance"))
                .andExpect(jsonPath("$.items[1].kind").value("REMINDER"))
                .andExpect(jsonPath("$.items[2].kind").value("THING"));
    }

    @Test
    void searchIsolatedByAuthenticatedUserAndRequiresQuery() throws Exception {
        String emailA = email("search-a");
        MvcResult registerA = register(emailA, "Search A");
        MockHttpSession sessionA = session(registerA);

        mockMvc.perform(post("/api/v1/things")
                        .with(csrf())
                        .session(sessionA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Private Car",
                                  "type":"Vehicle",
                                  "detail":"Private"
                                }
                                """))
                .andExpect(status().isOk());

        String emailB = email("search-b");
        MvcResult registerB = register(emailB, "Search B");
        MockHttpSession sessionB = session(registerB);

        mockMvc.perform(get("/api/v1/search")
                        .param("q", "private")
                        .session(sessionB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));

        mockMvc.perform(get("/api/v1/search")
                        .param("q", "private")
                        .session(sessionA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1));

        mockMvc.perform(get("/api/v1/search")
                        .param("q", "   ")
                        .session(sessionA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));

        mockMvc.perform(get("/api/v1/search")
                        .param("q", "private"))
                .andExpect(status().isUnauthorized());
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
