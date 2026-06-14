package com.financetracker.helper;

import com.financetracker.dto.request.LoginRequest;
import com.financetracker.dto.request.RegisterRequest;
import com.financetracker.dto.request.AccountRequest;
import com.financetracker.dto.request.TransactionRequest;
import com.financetracker.entity.Account;
import com.financetracker.entity.User;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public class TestDataFactory {

    // ─── Users ───────────────────────────────────────
    public static User createUser() {
        return User.builder()
            .id(UUID.randomUUID())
            .email("test@example.com")
            .passwordHash("$2a$10$hashedpassword")
            .fullName("Test User")
            .currency("INR")
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    }

    public static User createUser(String email) {
        return User.builder()
            .id(UUID.randomUUID())
            .email(email)
            .passwordHash("$2a$10$hashedpassword")
            .fullName("Test User")
            .currency("INR")
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    }

    public static RegisterRequest createRegisterRequest() {
        return new RegisterRequest(
            "test@example.com",
            "password123",
            "Test User"
        );
    }

    public static LoginRequest createLoginRequest() {
        return new LoginRequest(
            "test@example.com",
            "password123"
        );
    }

    // ─── Accounts ────────────────────────────────────
    public static Account createAccount(User user) {
        return Account.builder()
            .id(UUID.randomUUID())
            .user(user)
            .name("Test Account")
            .type("savings")
            .balance(BigDecimal.valueOf(50000))
            .currency("INR")
            .isActive(true)
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();
    }

    public static AccountRequest createAccountRequest() {
        return new AccountRequest(
            "HDFC Savings",
            "savings",
            BigDecimal.valueOf(50000),
            "INR"
        );
    }

    // ─── Transactions ─────────────────────────────────
    public static TransactionRequest createExpenseRequest(UUID accountId) {
        return new TransactionRequest(
            accountId,
            "expense",
            BigDecimal.valueOf(1000),
            "INR",
            "Food",
            "Test expense",
            LocalDate.now(),
            null
        );
    }

    public static TransactionRequest createIncomeRequest(UUID accountId) {
        return new TransactionRequest(
            accountId,
            "income",
            BigDecimal.valueOf(85000),
            "INR",
            "Salary",
            "Monthly salary",
            LocalDate.now(),
            null
        );
    }
}
