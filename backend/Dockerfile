# syntax=docker/dockerfile:1

# ---- Build stage: compile the Spring Boot jar with Maven ----
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Resolve dependencies from pom.xml first so they cache in their own layer and
# don't re-download on every source change.
COPY pom.xml .
RUN mvn -B -q dependency:go-offline

# Copy source and build the executable jar (tests run in CI, not in the image build).
# lombok.config copies @Qualifier onto generated constructors; without it the photo stores and upload limiters are ambiguous.
COPY lombok.config .
COPY src ./src
RUN mvn -B -q clean package -DskipTests

# ---- Runtime stage: run the jar on a small JRE as a non-root user ----
FROM eclipse-temurin:21-jre AS runtime
WORKDIR /app

# curl is used by the Docker healthcheck (compose probes /actuator/health).
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && useradd -r -u 1001 appuser

# Copy only the built jar from the build stage.
COPY --from=build /app/target/*.jar app.jar

# Commit SHA from CI, read as the Sentry release; declared late so it does not bust the build cache.
ARG GIT_SHA
ENV GIT_SHA=$GIT_SHA

USER appuser
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
