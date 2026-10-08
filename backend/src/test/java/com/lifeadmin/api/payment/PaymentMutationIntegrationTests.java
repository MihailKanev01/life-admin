package com.lifeadmin.api.payment;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
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
class PaymentMutationIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void paymentCanBeUpdatedAndRescheduledFieldsPersist() throws Exception {
        MockHttpSession session = register("payment-update");

        MvcResult created = mockMvc.perform(post("/api/v1/payments")
                        .with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Old Internet",
                                  "type":"BILL",
                                  "amount":25.00,
                                  "currency":"EUR",
                                  "frequency":"MONTHLY",
                                  "nextDueDate":"2026-11-15"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();

        String id = com.jayway.jsonpath.JsonPath.read(created.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(patch("/api/v1/payments/" + id)
                        .with(csrf()).session(session)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Fiber Internet",
                                  "type":"SUBSCRIPTION",
                                  "amount":29.99,
                                  "currency":"EUR",
                                  "frequency":"YEARLY",
                                  "nextDueDate":"2027-01-15",
                                  "thingId":null
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Fiber Internet"))
                .andExpect(jsonPath("$.type").value("SUBSCRIPTION"))
                .andExpect(jsonPath("$.amount").value(29.99))
                .andExpect(jsonPath("$.frequency").value("YEARLY"))
                .andExpect(jsonPath("$.nextDueDate").value("2027-01-15"));
    }

    @Test
    void paymentUpdateCannotLinkAnotherUsersThing() throws Exception {
        MockHttpSession owner = register("payment-owner");
        MockHttpSession other = register("payment-other");

        MvcResult thing = mockMvc.perform(post("/api/v1/things")
                        .with(csrf()).session(owner)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Private Mazda","type":"Vehicle","detail":"240000 km"}
                                """))
                .andExpect(status().isOk())
                .andReturn();
        String thingId = com.jayway.jsonpath.JsonPath.read(thing.getResponse().getContentAsString(), "$.id");

        MvcResult payment = mockMvc.perform(post("/api/v1/payments")
                        .with(csrf()).session(other)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Internet",
                                  "type":"BILL",
                                  "amount":25.00,
                                  "currency":"EUR",
                                  "frequency":"MONTHLY",
                                  "nextDueDate":"2026-11-15"
                                }
                                """))
                .andExpect(status().isOk())
                .andReturn();
        String paymentId = com.jayway.jsonpath.JsonPath.read(payment.getResponse().getContentAsString(), "$.id");

        mockMvc.perform(patch("/api/v1/payments/" + paymentId)
                        .with(csrf()).session(other)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name":"Internet",
                                  "type":"BILL",
                                  "amount":25.00,
                                  "currency":"EUR",
                                  "frequency":"MONTHLY",
                                  "nextDueDate":"2026-11-15",
                                  "thingId":"%s"
                                }
                                """.formatted(thingId)))
                .andExpect(status().isNotFound());
    }

    private MockHttpSession register(String prefix) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/register")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "email":"%s-%s@example.com",
                                  "password":"LifeAdmin-Test-2026!",
                                  "displayName":"Payment User",
                                  "timezone":"Europe/Sofia"
                                }
                                """.formatted(prefix, UUID.randomUUID())))
                .andExpect(status().isOk())
                .andReturn();
        return (MockHttpSession) result.getRequest().getSession(false);
    }
}
