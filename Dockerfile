# Build the Spring Boot API from the backend module.
FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /build
COPY backend/pom.xml backend/pom.xml
COPY backend/src backend/src

RUN mvn -f backend/pom.xml -B -ntp package -DskipTests

# Run the packaged API on a small Java 21 runtime.
FROM eclipse-temurin:21-jre

WORKDIR /app
COPY --from=build /build/backend/target/life-admin-api-*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
