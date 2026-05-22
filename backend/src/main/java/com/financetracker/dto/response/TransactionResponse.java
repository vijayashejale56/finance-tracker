package com.financetracker.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Instant;
import java.util.UUID;

public record TransactionResponse(
    UUID id,
    UUID accountId,
    String accountName,
    String type,
    BigDecimal amount,
    String currency,
    String category,
    String description,
    LocalDate transactionDate,
    String status,
    Instant createdAt
) {}