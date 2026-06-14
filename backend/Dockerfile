# ═══════════════════════════════════════
# Stage 1 — Build
# Uses Maven to compile the Spring Boot app
# ═══════════════════════════════════════
FROM maven:3.9.6-amazoncorretto-21 AS build

WORKDIR /app

# Copy pom.xml first — Docker caches this layer
# Only re-downloads dependencies if pom.xml changes
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the JAR, skip tests (tests run in CI/CD)
RUN mvn clean package -DskipTests

# ═══════════════════════════════════════
# Stage 2 — Run
# Uses only Java runtime — no Maven needed
# Much smaller final image
# ═══════════════════════════════════════
FROM amazoncorretto:21-alpine

WORKDIR /app

# Copy only the JAR from Stage 1
COPY --from=build /app/target/*.jar app.jar

# Expose port 8080
EXPOSE 8080

# Health check — Railway uses this to know app is ready
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD wget -q --spider http://localhost:8080/actuator/health || exit 1

# Run the app
# JAVA_OPTS allows passing JVM arguments via environment variable
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]