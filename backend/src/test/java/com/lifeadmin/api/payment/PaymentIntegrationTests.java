package com.lifeadmin.api.payment;

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
class PaymentIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void paymentsAreIsolatedByAuthenticatedUser() throws Exception {
        MockHttpSession sessionA = register(email("payment-a"), "User A");
        MockHttpSession sessionB = register(email("payment-b"), "User B");

        createPayment(sessionA, null);

        mockMvc.perform(get("/api/v1/payments").session(sessionB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));

        mockMvc.perform(get("/api/v1/payments").session(sessionA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].name").value("Internet"));
    }

    @Test
    void paymentCanBeLinkedOnlyToOwnThing() throws Exception {
        MockHttpSession sessionA = register(email("payment-thing-a"), "Owner A");
        MockHttpSession sessionB = register(email("payment-thing-b"), "Owner B");

        MvcResult thing = mockMvc.perform(post("/api/v1/things")
                        .with(csrf())
                        .session(sessionA)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Mazda 6","type":"Vehicle","detail":"235,420 km"}
                                """))
                .andExpect(status().isOk())
                .andReturn();

        String thingId = thing.getResponse().getContentAsString()
                .replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(post("/api/v1/payments")
                        .with(csrf())
                        .session(sessionB)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Car insurance",
                                  "type":"RENEWAL",
                                  "amount":120.00,
                                  "currency":"EUR",
                                  "frequency":"YEARLY",
                                  "nextDueDate":"2027-12-14",
                                  "thingId":"%s"
                                }
                                """.formatted(thingId)))
                .andExpect(status().isNotFound());
    }

    @Test
    void markPaidAdvancesRecurringDate() throws Exception {
        MockHttpSession session = register(email("mark-paid"), "User");

        createPayment(session, null);

        MvcResult list = mockMvc.perform(get("/api/v1/payments").session(session))
                .andExpect(status().isOk())
                .andReturn();

        String paymentId = list.getResponse().getContentAsString()
                .replaceAll(".*\"id\":\"([^\"]+)\".*", "$1");

        mockMvc.perform(post("/api/v1/payments/%s/mark-paid".formatted(paymentId))
                        .with(csrf())
                        .session(session))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nextDueDate").value("2026-11-15"));
    }

    private void createPayment(MockHttpSession session, String thingId) throws Exception {
        mockMvc.perform(post("/api/v1/payments")
                        .with(csrf())
                        .session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Internet",
                                  "type":"BILL",
                                  "amount":25.00,
                                  "currency":"EUR",
                                  "frequency":"MONTHLY",
                                  "nextDueDate":"2026-10-15",
                                  "thingId":%s
                                }
                                """.formatted(thingId == null ? "null" : "\"" + thingId + "\"")))
                .andExpect(status().isOk());
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
