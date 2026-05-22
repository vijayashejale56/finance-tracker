package com.financetracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record AccountRequest(
    @NotBlank String name,
    @NotBlank String type,
    @NotNull BigDecimal balance,
    String currency
) {}