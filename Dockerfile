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

# Render Free gives this service only a fraction of a CPU core.
# Favor faster JVM startup and lower background-thread overhead over peak throughput.
# Revisit these settings if the service moves to a larger instance or has sustained traffic.
ENTRYPOINT ["java", "-XX:TieredStopAtLevel=1", "-XX:+UseSerialGC", "-XX:ActiveProcessorCount=1", "-jar", "app.jar"]
