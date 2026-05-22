package com.financetracker.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record TransactionRequest(
    @NotNull UUID accountId,
    @NotBlank String type,
    @NotNull @Positive BigDecimal amount,
    String currency,
    String category,
    String description,
    @NotNull LocalDate transactionDate,
    UUID transferToAccountId
) {}