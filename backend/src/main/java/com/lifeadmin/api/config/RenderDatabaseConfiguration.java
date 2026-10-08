package com.lifeadmin.api.config;

import com.zaxxer.hikari.HikariDataSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Conditional;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;
import java.net.URI;

@Configuration(proxyBeanMethods = false)
@Conditional(RenderDatabaseUrlCondition.class)
public class RenderDatabaseConfiguration {

    @Bean
    DataSource renderDataSource(org.springframework.core.env.Environment environment) {
        String connectionUrl = environment.getRequiredProperty("DATABASE_URL");
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

        HikariDataSource dataSource = new HikariDataSource();
        dataSource.setJdbcUrl(jdbcUrl.toString());
        dataSource.setUsername(username);
        dataSource.setPassword(password);
        return dataSource;
    }
}
