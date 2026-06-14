package com.financetracker.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record GoalRequest(
    @NotBlank String name,
    @NotNull @Positive BigDecimal targetAmount,
    BigDecimal currentAmount,
    @NotNull LocalDate deadline,
    UUID linkedAccountId,
    String notes
) {}