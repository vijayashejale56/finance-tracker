package com.financetracker.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record BudgetResponse(
    UUID id,
    String category,
    BigDecimal limitAmount,
    BigDecimal spentAmount,
    BigDecimal remainingAmount,
    double percentageUsed,
    String status,          // SAFE, WARNING, EXCEEDED
    Integer month,
    Integer year
) {}