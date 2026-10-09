package com.lifeadmin.api.email;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import java.util.Locale;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class ResendEmailClient {
    private static final Logger LOGGER = LoggerFactory.getLogger(ResendEmailClient.class);
    private static final Duration REQUEST_TIMEOUT = Duration.ofSeconds(8);
    private final String apiKey;
    private final String from;
    private final URI endpoint;
    private final HttpClient httpClient;

    @Autowired
    public ResendEmailClient(
            @Value("${RESEND_API_KEY:}") String apiKey,
            @Value("${life-admin.mail.from}") String from) {
        this(apiKey, from, URI.create("https://api.resend.com/emails"),
                HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build());
    }

    ResendEmailClient(String apiKey, String from,
            URI endpoint, HttpClient httpClient) {
        this.apiKey = apiKey == null ? "" : apiKey.trim();
        this.from = from == null ? "" : from.trim();
        this.endpoint = endpoint;
        this.httpClient = httpClient;
    }

    public boolean isConfigured() {
        return !apiKey.isBlank()
                && from.contains("@")
                && !from.toLowerCase(Locale.ROOT).contains("localhost");
    }

    public void send(String recipient, String subject, String text) {
        if (!isConfigured()) {
            throw new IllegalStateException(
                    "Email delivery is not configured. Set RESEND_API_KEY and a verified MAIL_FROM address.");
        }
        String payload = "{\"from\":" + jsonString(from)
                + ",\"to\":[" + jsonString(recipient) + "]"
                + ",\"subject\":" + jsonString(subject)
                + ",\"text\":" + jsonString(text) + "}";
        HttpRequest request = HttpRequest.newBuilder(endpoint)
                .timeout(REQUEST_TIMEOUT)
                .header("Authorization", "Bearer " + apiKey)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();
        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                LOGGER.error("Email provider rejected a transactional email (HTTP {})", response.statusCode());
                throw new IllegalStateException(
                        "Email provider rejected the message (HTTP " + response.statusCode() + ")");
            }
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Email delivery was interrupted", exception);
        } catch (IOException exception) {
            throw new IllegalStateException("Email provider could not be reached", exception);
        }
    }

    private static String jsonString(String value) {
        StringBuilder result = new StringBuilder("\"");
        for (int i = 0; i < value.length(); i++) {
            char current = value.charAt(i);
            switch (current) {
                case '"' -> result.append("\\\"");
                case '\\' -> result.append("\\\\");
                case '\b' -> result.append("\\b");
                case '\f' -> result.append("\\f");
                case '\n' -> result.append("\\n");
                case '\r' -> result.append("\\r");
                case '\t' -> result.append("\\t");
                default -> {
                    if (current < 0x20) {
                        result.append(String.format(Locale.ROOT, "\\u%04x", (int) current));
                    } else {
                        result.append(current);
                    }
                }
            }
        }
        return result.append('"').toString();
    }
}
