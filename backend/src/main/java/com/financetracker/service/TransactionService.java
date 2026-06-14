package com.financetracker.service;

import com.financetracker.dto.request.TransactionRequest;
import com.financetracker.dto.response.PageResponse;
import com.financetracker.dto.response.TransactionResponse;
import com.financetracker.entity.Account;
import com.financetracker.entity.Transaction;
import com.financetracker.entity.User;
import com.financetracker.repository.AccountRepository;
import com.financetracker.repository.TransactionRepository;
import com.financetracker.repository.UserRepository;
import com.financetracker.exception.ResourceNotFoundException;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.financetracker.entity.Transaction;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@Transactional
@RequiredArgsConstructor
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    private User getCurrentUser() {
        String email = SecurityContextHolder
            .getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    private TransactionResponse toResponse(Transaction t) {
        return new TransactionResponse(
            t.getId(),
            t.getAccount().getId(),
            t.getAccount().getName(),
            t.getType(),
            t.getAmount(),
            t.getCurrency(),
            t.getCategory(),
            t.getDescription(),
            t.getTransactionDate(),
            t.getStatus(),
            t.getCreatedAt()
        );
    }

    // GET paginated transactions with filters
    public PageResponse<TransactionResponse> getTransactions(
            int page, int size,
            String type, String category,
            UUID accountId, LocalDate from, LocalDate to,
            String keyword, BigDecimal minAmount, BigDecimal maxAmount,
            String sortBy, String sortDir) {

        User user = getCurrentUser();

         // Build sort direction
        org.springframework.data.domain.Sort.Direction direction =
            sortDir.equalsIgnoreCase("asc")
                ? org.springframework.data.domain.Sort.Direction.ASC
                : org.springframework.data.domain.Sort.Direction.DESC;

        // Map sortBy parameter to entity field name
        String sortField = switch (sortBy) {
            case "amount" -> "amount";
            case "category" -> "category";
            case "description" -> "description";
            default -> "transactionDate";
        };

        // Build pageable with sort
    org.springframework.data.domain.Pageable pageable =
        org.springframework.data.domain.PageRequest.of(
            page, size,
            org.springframework.data.domain.Sort.by(
                direction, sortField));

    // Clean keyword — empty string becomes null
    String cleanKeyword = (keyword != null &&
        !keyword.trim().isEmpty())
        ? keyword.trim() : null;

        Page<Transaction> result = transactionRepository.findByFilters(
            user.getId(), type, category, accountId, from, to, cleanKeyword, minAmount, maxAmount,
            PageRequest.of(page, size)
        );

        return new PageResponse<>(
            result.getContent().stream().map(this::toResponse).toList(),
            result.getNumber(),
            result.getSize(),
            result.getTotalElements(),
            result.getTotalPages(),
            result.isLast()
        );
    }

    // POST create transaction — also updates account balance
    @Transactional
    public TransactionResponse createTransaction(TransactionRequest request) {
        User user = getCurrentUser();

        // Account account = accountRepository
        //     .findByIdAndUserId(request.accountId(), user.getId())
        //     .orElseThrow(() -> new RuntimeException("Account not found"));

        Account account = accountRepository
    .findByIdAndUserId(request.accountId(), user.getId())
    .orElseThrow(() -> new ResourceNotFoundException(
        "Account", request.accountId().toString()));

        // Update account balance based on transaction type
        if (request.type().equals("income")) {
            account.setBalance(account.getBalance().add(request.amount()));
        } else if (request.type().equals("expense")) {
            account.setBalance(account.getBalance().subtract(request.amount()));
        } else if (request.type().equals("transfer")) {
            // Deduct from source account
            account.setBalance(account.getBalance().subtract(request.amount()));

            // Add to destination account
            if (request.transferToAccountId() != null) {
                Account dest = accountRepository
                    .findByIdAndUserId(request.transferToAccountId(), user.getId())
                    .orElseThrow(() -> new RuntimeException("Destination account not found"));
                dest.setBalance(dest.getBalance().add(request.amount()));
                accountRepository.save(dest);
            }
        }

        accountRepository.save(account);

        Transaction transaction = Transaction.builder()
            .account(account)
            .type(request.type())
            .amount(request.amount())
            .currency(request.currency() != null ? request.currency() : account.getCurrency())
            .category(request.category())
            .description(request.description())
            .transactionDate(request.transactionDate())
            .build();

        return toResponse(transactionRepository.save(transaction));
    }

    // DELETE transaction — also reverses account balance
    @Transactional
    public void deleteTransaction(UUID transactionId) {
        User user = getCurrentUser();

        Transaction transaction = transactionRepository.findById(transactionId)
            .filter(t -> t.getAccount().getUser().getId().equals(user.getId()))
            .orElseThrow(() -> new RuntimeException("Transaction not found"));

        Account account = transaction.getAccount();

        // Reverse the balance effect
        if (transaction.getType().equals("income")) {
            account.setBalance(account.getBalance().subtract(transaction.getAmount()));
        } else if (transaction.getType().equals("expense")) {
            account.setBalance(account.getBalance().add(transaction.getAmount()));
        }

        accountRepository.save(account);
        transactionRepository.delete(transaction);
    }

    // GET this month summary for dashboard
    public java.util.Map<String, BigDecimal> getMonthlySummary() {
        User user = getCurrentUser();
        LocalDate start = LocalDate.now().withDayOfMonth(1);
        LocalDate end = LocalDate.now();

        BigDecimal income = transactionRepository
            .sumIncomeByUserAndDateRange(user.getId(), start, end);
        BigDecimal expense = transactionRepository
            .sumExpenseByUserAndDateRange(user.getId(), start, end);

        return java.util.Map.of(
            "income", income,
            "expense", expense,
            "savings", income.subtract(expense)
        );
    }

    // Spending by category — for pie chart
    public List<Map<String, Object>> getSpendingByCategory(
            LocalDate from, LocalDate to) {
        User user = getCurrentUser();

        if (from == null) from = LocalDate.now().withDayOfMonth(1);
        if (to == null) to = LocalDate.now();

        final LocalDate finalFrom = from;
        final LocalDate finalTo = to;

        // Get all expense transactions in range
        List<Transaction> expenses = transactionRepository
            .findByFilters(user.getId(), "expense", null, null,
                finalFrom, finalTo, null, null, null,
                PageRequest.of(0, 1000))
            .getContent();

        // Group by category and sum amounts
        return expenses.stream()
            .collect(java.util.stream.Collectors.groupingBy(
                t -> t.getCategory() != null ? t.getCategory() : "Other",
                java.util.stream.Collectors.reducing(
                    BigDecimal.ZERO, Transaction::getAmount, BigDecimal::add)
            ))
            .entrySet().stream()
            .map(e -> {
                Map<String, Object> map = new java.util.LinkedHashMap<>();
                map.put("category", e.getKey());
                map.put("amount", e.getValue());
                return map;
            })
            .sorted((a, b) -> ((BigDecimal) b.get("amount"))
                .compareTo((BigDecimal) a.get("amount")))
            .toList();
    }

    // Monthly income vs expense — for bar chart + line chart
    public List<Map<String, Object>> getMonthlyTrend() {
        User user = getCurrentUser();

        // Last 6 months
        List<Map<String, Object>> result = new java.util.ArrayList<>();

        for (int i = 5; i >= 0; i--) {
            LocalDate month = LocalDate.now().minusMonths(i);
            LocalDate start = month.withDayOfMonth(1);
            LocalDate end = month.withDayOfMonth(
                month.lengthOfMonth());

            BigDecimal income = transactionRepository
                .sumIncomeByUserAndDateRange(user.getId(), start, end);
            BigDecimal expense = transactionRepository
                .sumExpenseByUserAndDateRange(user.getId(), start, end);

            Map<String, Object> map = new java.util.LinkedHashMap<>();
            map.put("month", month.getMonth().getDisplayName(
                java.time.format.TextStyle.SHORT,
                java.util.Locale.ENGLISH));
            map.put("income", income);
            map.put("expense", expense);
            map.put("savings", income.subtract(expense));
            result.add(map);
        }

        return result;
    }
}