# Life Admin API

Spring Boot 4.1.1 backend foundation for the Life Admin web-first product.

## Stack

- Java 21
- Spring Boot 4.1.1
- Spring MVC
- Spring Data JPA
- PostgreSQL
- Flyway
- Actuator

Spring Boot 4.1.1 is the current stable release at the time this project foundation was created. The Spring documentation recommends Maven or Gradle and provides the official web MVC starter. See:
https://docs.spring.io/spring-boot/
https://docs.spring.io/spring-boot/reference/web/index.html

## Run locally

Start PostgreSQL:

```bash
docker compose -f ../infra/docker-compose.yml up -d
```

Run API:

```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=local
```

The project does not currently include Maven Wrapper files. Use local Maven 3.6.3+ or add the wrapper before implementation begins.

Health:
```
GET http://localhost:8080/api/v1/system/health
```

## Current scope

Only infrastructure and a health endpoint exist.

No business entities have been implemented yet.
