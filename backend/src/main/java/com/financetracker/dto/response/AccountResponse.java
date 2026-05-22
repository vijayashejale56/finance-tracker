package com.financetracker.dto.response;

import java.math.BigDecimal;
import java.util.UUID;

public record AccountResponse(
    UUID id,
    String name,
    String type,
    BigDecimal balance,
    String currency,
    boolean isActive
) {}