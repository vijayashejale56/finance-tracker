package com.financetracker.dto.response;

public record AuthResponse(
    String accessToken,
    String refreshToken,
    String email,
    String fullName
) {}