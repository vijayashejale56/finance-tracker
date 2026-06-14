package com.financetracker.dto.response;

import java.time.Instant;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
    boolean success,
    String code,
    String message,
    Instant timestamp,
    String path,
    Map<String, String> validationErrors
) {
    // Constructor for simple errors
    public static ErrorResponse of(String code, String message, String path) {
        return new ErrorResponse(
            false, code, message, Instant.now(), path, null);
    }

    // Constructor for validation errors
    public static ErrorResponse validation(
            Map<String, String> errors, String path) {
        return new ErrorResponse(
            false, "VALIDATION_FAILED",
            "Request validation failed",
            Instant.now(), path, errors);
    }
}