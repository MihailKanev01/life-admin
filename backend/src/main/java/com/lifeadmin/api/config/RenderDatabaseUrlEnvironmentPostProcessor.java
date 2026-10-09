package com.lifeadmin.api.config;

import org.springframework.boot.EnvironmentPostProcessor;
import org.springframework.boot.SpringApplication;
import org.springframework.core.env.ConfigurableEnvironment;
import org.springframework.core.env.MapPropertySource;

import java.net.URI;
import java.util.Map;

public final class RenderDatabaseUrlEnvironmentPostProcessor implements EnvironmentPostProcessor {

    @Override
    public void postProcessEnvironment(ConfigurableEnvironment environment, SpringApplication application) {
        String connectionUrl = environment.getProperty("DATABASE_URL");
        if (connectionUrl == null || connectionUrl.isBlank()
                || connectionUrl.startsWith("jdbc:")) {
            return;
        }

        URI uri = URI.create(connectionUrl);
        if (!"postgresql".equalsIgnoreCase(uri.getScheme())
                && !"postgres".equalsIgnoreCase(uri.getScheme())) {
            throw new IllegalArgumentException("DATABASE_URL must use the postgresql:// scheme.");
        }

        String userInfo = uri.getUserInfo();
        if (userInfo == null || userInfo.isBlank()) {
            throw new IllegalArgumentException("DATABASE_URL must include database credentials.");
        }

        int separator = userInfo.indexOf(':');
        if (separator <= 0 || separator == userInfo.length() - 1) {
            throw new IllegalArgumentException("DATABASE_URL must include both username and password.");
        }

        String username = userInfo.substring(0, separator);
        String password = userInfo.substring(separator + 1);

        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("DATABASE_URL must include a database host.");
        }

        String databasePath = uri.getPath();
        if (databasePath == null || databasePath.length() <= 1) {
            throw new IllegalArgumentException("DATABASE_URL must include a database name.");
        }

        StringBuilder jdbcUrl = new StringBuilder("jdbc:postgresql://").append(host);
        if (uri.getPort() > 0) {
            jdbcUrl.append(':').append(uri.getPort());
        }
        jdbcUrl.append(databasePath);

        if (uri.getRawQuery() != null && !uri.getRawQuery().isBlank()) {
            jdbcUrl.append('?').append(uri.getRawQuery());
        }

        environment.getPropertySources().addFirst(new MapPropertySource(
                "renderDatabaseUrl",
                Map.of(
                        "spring.datasource.url", jdbcUrl.toString(),
                        "spring.datasource.username", username,
                        "spring.datasource.password", password
                )
        ));
    }
}
