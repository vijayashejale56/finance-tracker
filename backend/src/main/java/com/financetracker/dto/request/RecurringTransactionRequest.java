package com.financetracker.dto.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record RecurringTransactionRequest(
    @NotNull UUID accountId,
    @NotBlank String type,
    @NotNull @Positive BigDecimal amount,
    String currency,
    String category,
    String description,
    @NotBlank String frequency,
    Integer dayOfMonth,
    @NotNull LocalDate startDate
) {}