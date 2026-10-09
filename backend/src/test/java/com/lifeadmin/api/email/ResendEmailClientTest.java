package com.lifeadmin.api.email;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;

class ResendEmailClientTest {
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void sendsAuthenticatedJsonThroughEmailApi() throws Exception {
        AtomicReference<String> authorization = new AtomicReference<>();
        AtomicReference<String> contentType = new AtomicReference<>();
        AtomicReference<String> body = new AtomicReference<>();
        HttpServer server = server(200, authorization, contentType, body);
        try {
            ResendEmailClient client = client(server, "re_test_key", "noreply@example.com");
            assertTrue(client.isConfigured());
            client.send("person@example.com", "Reset your password", "Use this secure link.");
            assertEquals("Bearer re_test_key", authorization.get());
            assertTrue(contentType.get().startsWith("application/json"));
            JsonNode payload = objectMapper.readTree(body.get());
            assertEquals("noreply@example.com", payload.path("from").asText());
            assertEquals("person@example.com", payload.path("to").get(0).asText());
            assertEquals("Reset your password", payload.path("subject").asText());
            assertEquals("Use this secure link.", payload.path("text").asText());
        } finally {
            server.stop(0);
        }
    }

    @Test
    void rejectsMissingCredentialsBeforeNetworkRequest() throws Exception {
        AtomicReference<String> authorization = new AtomicReference<>();
        AtomicReference<String> contentType = new AtomicReference<>();
        AtomicReference<String> body = new AtomicReference<>();
        HttpServer server = server(200, authorization, contentType, body);
        try {
            ResendEmailClient client = client(server, "", "noreply@localhost");
            assertFalse(client.isConfigured());
            assertThrows(IllegalStateException.class,
                    () -> client.send("person@example.com", "Reset your password", "Body"));
            assertEquals(null, authorization.get());
        } finally {
            server.stop(0);
        }
    }

    @Test
    void rejectsProviderFailureWithoutExposingProviderBody() throws Exception {
        AtomicReference<String> authorization = new AtomicReference<>();
        AtomicReference<String> contentType = new AtomicReference<>();
        AtomicReference<String> body = new AtomicReference<>();
        HttpServer server = server(403, authorization, contentType, body);
        try {
            ResendEmailClient client = client(server, "re_test_key", "noreply@example.com");
            IllegalStateException exception = assertThrows(IllegalStateException.class,
                    () -> client.send("person@example.com", "Reset your password", "Body"));
            assertTrue(exception.getMessage().contains("HTTP 403"));
            assertFalse(exception.getMessage().contains("private provider detail"));
        } finally {
            server.stop(0);
        }
    }

    private ResendEmailClient client(HttpServer server, String apiKey, String from) {
        URI endpoint = URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/emails");
        return new ResendEmailClient(objectMapper, apiKey, from, endpoint, HttpClient.newHttpClient());
    }

    private HttpServer server(int status, AtomicReference<String> authorization,
            AtomicReference<String> contentType, AtomicReference<String> body) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/emails", exchange -> {
            authorization.set(exchange.getRequestHeaders().getFirst("Authorization"));
            contentType.set(exchange.getRequestHeaders().getFirst("Content-Type"));
            body.set(new String(exchange.getRequestBody().readAllBytes(), StandardCharsets.UTF_8));
            byte[] response = (status == 200 ? "{\"id\":\"mail_test\"}"
                    : "{\"error\":\"private provider detail\"}").getBytes(StandardCharsets.UTF_8);
            exchange.sendResponseHeaders(status, response.length);
            try (var output = exchange.getResponseBody()) {
                output.write(response);
            }
        });
        server.start();
        return server;
    }
}
