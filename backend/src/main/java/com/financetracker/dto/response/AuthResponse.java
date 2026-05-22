package com.financetracker.dto.response;

public record AuthResponse(
    String token,
    String email,
    String fullName
) {}