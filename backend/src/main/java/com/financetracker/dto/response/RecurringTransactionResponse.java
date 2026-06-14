package com.financetracker.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record RecurringTransactionResponse(
    UUID id,
    UUID accountId,
    String accountName,
    String type,
    BigDecimal amount,
    String currency,
    String category,
    String description,
    String frequency,
    Integer dayOfMonth,
    LocalDate nextDueDate,
    LocalDate lastExecutedDate,
    boolean isActive,
    long daysUntilNext
) {}