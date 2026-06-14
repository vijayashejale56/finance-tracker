package com.financetracker.dto.response;

public record RefreshTokenResponse(
    String accessToken,
    String refreshToken
) {}