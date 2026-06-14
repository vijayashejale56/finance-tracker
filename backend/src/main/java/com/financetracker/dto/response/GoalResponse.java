package com.financetracker.dto.response;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public record GoalResponse(
    UUID id,
    String name,
    BigDecimal targetAmount,
    BigDecimal currentAmount,
    BigDecimal remainingAmount,
    double percentageComplete,
    LocalDate deadline,
    long daysRemaining,
    long monthsRemaining,
    BigDecimal monthlyRequired,
    String status,           // IN_PROGRESS, COMPLETED, CANCELLED
    String trackingStatus,   // ON_TRACK, BEHIND, COMPLETED
    String notes,
    UUID linkedAccountId,
    String linkedAccountName
) {}