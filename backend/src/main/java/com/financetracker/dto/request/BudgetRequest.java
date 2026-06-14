package com.financetracker.dto.request;

import java.math.BigDecimal;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record BudgetRequest(
    @NotBlank String category,
    @NotNull @Positive BigDecimal limitAmount,
    @NotNull @Min(1) @Max(12) Integer month,
    @NotNull @Min(2020) Integer year
) {}