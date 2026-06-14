package com.financetracker.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.financetracker.dto.response.ErrorResponse;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.beans.factory.annotation.Value;


// import org.springframework.context.annotation.Profile;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${app.rate-limit.login-capacity:5}")
    private int loginCapacity;

    @Value("${app.rate-limit.login-refill-seconds:60}")
    private int loginRefillSeconds;

    @Value("${app.rate-limit.api-capacity:100}")
    private int apiCapacity;

    private final Map<String, Bucket> loginBuckets =
        new ConcurrentHashMap<>();
    private final Map<String, Bucket> apiBuckets =
        new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public RateLimitFilter() {
        this.objectMapper = new ObjectMapper();
        this.objectMapper.registerModule(new JavaTimeModule());
    }

    // ← This now uses @Value fields
    private Bucket createLoginBucket() {
        return Bucket.builder()
            .addLimit(Bandwidth.builder()
                .capacity(loginCapacity)
                .refillGreedy(loginCapacity,
                    Duration.ofSeconds(loginRefillSeconds))
                .build())
            .build();
    }

    private Bucket createApiBucket() {
        return Bucket.builder()
            .addLimit(Bandwidth.builder()
                .capacity(apiCapacity)
                .refillGreedy(apiCapacity, Duration.ofMinutes(1))
                .build())
            .build();
    }

    // ← Add this method to clear buckets between tests
    public void resetBuckets() {
        loginBuckets.clear();
        apiBuckets.clear();
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String ip = getClientIP(request);
        String path = request.getRequestURI();
        String method = request.getMethod();

        if (method.equals("POST") &&
                (path.endsWith("/auth/login") ||
                 path.endsWith("/auth/register"))) {

            Bucket bucket = loginBuckets.computeIfAbsent(
                ip, k -> createLoginBucket());

            if (!bucket.tryConsume(1)) {
                log.warn("LOGIN rate limit exceeded - IP: {}", ip);
                sendRateLimitResponse(response,
                    "Too many login attempts. " +
                    "Please try again in 1 minute.");
                return;
            }

            filterChain.doFilter(request, response);
            return;
        }

        if (!path.contains("/swagger") &&
                !path.contains("/v3/api-docs")) {

            Bucket bucket = apiBuckets.computeIfAbsent(
                ip, k -> createApiBucket());

            if (!bucket.tryConsume(1)) {
                log.warn("API rate limit exceeded - IP: {}", ip);
                sendRateLimitResponse(response,
                    "Too many requests. Please slow down.");
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    private void sendRateLimitResponse(HttpServletResponse response,
                                        String message)
            throws IOException {
        response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        ErrorResponse error = ErrorResponse.of(
            "RATE_LIMIT_EXCEEDED", message,
            "/api/v1/auth/login");
        String json = objectMapper.writeValueAsString(error);
        response.getWriter().write(json);
        response.getWriter().flush();
    }
}

// @Slf4j
// @Component
// // @Profile("!test")
// public class RateLimitFilter extends OncePerRequestFilter {

//     private final Map<String, Bucket> loginBuckets =
//         new ConcurrentHashMap<>();
//     private final Map<String, Bucket> apiBuckets =
//         new ConcurrentHashMap<>();
//     private final ObjectMapper objectMapper;

//     public RateLimitFilter() {
//         this.objectMapper = new ObjectMapper();
//         this.objectMapper.registerModule(new JavaTimeModule());
//     }

//     private Bucket createLoginBucket() {
//         return Bucket.builder()
//             .addLimit(Bandwidth.builder()
//                 .capacity(5)
//                 .refillGreedy(5, Duration.ofMinutes(1))
//                 .build())
//             .build();
//     }

//     private Bucket createApiBucket() {
//         return Bucket.builder()
//             .addLimit(Bandwidth.builder()
//                 .capacity(100)
//                 .refillGreedy(100, Duration.ofMinutes(1))
//                 .build())
//             .build();
//     }

//     @Override
//     protected void doFilterInternal(HttpServletRequest request,
//                                     HttpServletResponse response,
//                                     FilterChain filterChain)
//             throws ServletException, IOException {

//         String ip = getClientIP(request);
//         String path = request.getRequestURI();
//         String method = request.getMethod();

//         // Strict rate limit for login and register
//         if (method.equals("POST") &&
//                 (path.endsWith("/auth/login") ||
//                  path.endsWith("/auth/register"))) {

//             Bucket bucket = loginBuckets.computeIfAbsent(
//                 ip, k -> createLoginBucket());

//             long availableTokens = bucket.getAvailableTokens();
//             log.debug("Rate limit check - IP: {}, tokens left: {}",
//                 ip, availableTokens);

//             if (!bucket.tryConsume(1)) {
//                 log.warn("LOGIN rate limit exceeded - IP: {}", ip);
//                 sendRateLimitResponse(response,
//                     "Too many login attempts. " +
//                     "Please try again in 1 minute.");
//                 return;
//             }

//             filterChain.doFilter(request, response);
//             return;
//         }

//         // General API rate limit
//         if (!path.contains("/swagger") &&
//                 !path.contains("/v3/api-docs")) {

//             Bucket bucket = apiBuckets.computeIfAbsent(
//                 ip, k -> createApiBucket());

//             if (!bucket.tryConsume(1)) {
//                 log.warn("API rate limit exceeded - IP: {}", ip);
//                 sendRateLimitResponse(response,
//                     "Too many requests. Please slow down.");
//                 return;
//             }
//         }

//         filterChain.doFilter(request, response);
//     }

//     private String getClientIP(HttpServletRequest request) {
//         String xForwardedFor = request.getHeader("X-Forwarded-For");
//         if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
//             return xForwardedFor.split(",")[0].trim();
//         }
//         String xRealIP = request.getHeader("X-Real-IP");
//         if (xRealIP != null && !xRealIP.isEmpty()) {
//             return xRealIP;
//         }
//         return request.getRemoteAddr();
//     }

//     private void sendRateLimitResponse(HttpServletResponse response,
//                                         String message)
//             throws IOException {
//         response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
//         response.setContentType(MediaType.APPLICATION_JSON_VALUE);
//         response.setCharacterEncoding("UTF-8");

//         ErrorResponse error = ErrorResponse.of(
//             "RATE_LIMIT_EXCEEDED", message,
//             "/api/v1/auth/login");

//         String json = objectMapper.writeValueAsString(error);
//         response.getWriter().write(json);
//         response.getWriter().flush();
//     }
// }