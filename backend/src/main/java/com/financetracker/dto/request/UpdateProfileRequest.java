package com.financetracker.dto.request;

import jakarta.validation.constraints.NotBlank;

public record UpdateProfileRequest(
    @NotBlank String fullName,
    String currency
) {}