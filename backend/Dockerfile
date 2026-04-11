# --- Build Stage ---
# Use the official Maven image — Maven is pre-installed, no wrapper needed
FROM maven:3.9-eclipse-temurin-21-alpine AS build
WORKDIR /app

# Copy pom.xml first so dependency layer is cached independently of source
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Build the application
COPY src ./src
RUN mvn package -DskipTests -B

# --- Runtime Stage ---
FROM eclipse-temurin:21-jre-alpine AS runtime
WORKDIR /app

# Security: run as non-root
RUN addgroup -S teriak && adduser -S teriak -G teriak
USER teriak

# Copy JAR from build stage
COPY --from=build /app/target/*.jar app.jar

# JVM tuning for containers
ENV JAVA_OPTS="-Xmx512m -Xms128m -XX:+UseG1GC -XX:+UseContainerSupport"

EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
