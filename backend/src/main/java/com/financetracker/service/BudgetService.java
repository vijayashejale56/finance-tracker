package com.financetracker.service;

import com.financetracker.dto.request.BudgetRequest;
import com.financetracker.dto.response.BudgetResponse;
import com.financetracker.entity.Budget;
import com.financetracker.entity.User;
import com.financetracker.exception.BadRequestException;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.repository.BudgetRepository;
import com.financetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BudgetService {

    private final BudgetRepository budgetRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    // ─── Get current logged in user ──────────────────
    private User getCurrentUser() {
        String email = SecurityContextHolder
            .getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException(
                "User", email));
    }

    // ─── Calculate budget status ──────────────────────
    private String calculateStatus(double percentage) {
        if (percentage >= 100) return "EXCEEDED";
        if (percentage >= 70)  return "WARNING";
        return "SAFE";
    }

    // ─── Convert entity to response ───────────────────
    // private BudgetResponse toResponse(Budget budget, UUID userId) {
    //     // Get actual spending for this category this month
    //     BigDecimal spent = budgetRepository.getSpentAmountForCategory(
    //         userId,
    //         budget.getCategory(),
    //         budget.getMonth(),
    //         budget.getYear()
    //     );

    //     BigDecimal limit = budget.getLimitAmount();

    //     // Calculate remaining — can be negative if exceeded
    //     BigDecimal remaining = limit.subtract(spent);

    //     // Calculate percentage used
    //     double percentage = 0.0;
    //     if (limit.compareTo(BigDecimal.ZERO) > 0) {
    //         percentage = spent.divide(limit, 4, RoundingMode.HALF_UP)
    //             .multiply(BigDecimal.valueOf(100))
    //             .doubleValue();
    //     }

    //     String status = calculateStatus(percentage);

    //     return new BudgetResponse(
    //         budget.getId(),
    //         budget.getCategory(),
    //         limit,
    //         spent,
    //         remaining,
    //         Math.round(percentage * 100.0) / 100.0,
    //         status,
    //         budget.getMonth(),
    //         budget.getYear()
    //     );
    // }

    private BudgetResponse toResponse(
            Budget budget, UUID userId) {
        User user = userRepository.findById(userId)
            .orElseThrow();

        BigDecimal spent =
            budgetRepository.getSpentAmountForCategory(
                userId, budget.getCategory(),
                budget.getMonth(), budget.getYear());

        BigDecimal limit = budget.getLimitAmount();
        BigDecimal remaining = limit.subtract(spent);

        double percentage = 0.0;
        if (limit.compareTo(BigDecimal.ZERO) > 0) {
            percentage = spent.divide(
                limit, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue();
        }

        String status = calculateStatus(percentage);

        // Send email when budget is exceeded
        // Only once — check if just crossed 100%
        if (status.equals("EXCEEDED") &&
    spent.subtract(limit).compareTo(
        BigDecimal.valueOf(1000)) <= 0) {
            String monthName = java.time.Month.of(
                budget.getMonth()).getDisplayName(
                    java.time.format.TextStyle.FULL,
                    java.util.Locale.ENGLISH);

            BigDecimal over = spent.subtract(limit);

            emailService.sendBudgetExceededEmail(
                user.getEmail(),
                user.getFullName(),
                budget.getCategory(),
                limit.toPlainString(),
                spent.toPlainString(),
                over.toPlainString(),
                String.format("%.1f", percentage),
                monthName + " " + budget.getYear()
            );
        }

        return new BudgetResponse(
            budget.getId(),
            budget.getCategory(),
            limit, spent, remaining,
            Math.round(percentage * 100.0) / 100.0,
            status,
            budget.getMonth(),
            budget.getYear()
        );
    }

    

    // ─── GET all budgets for current month ────────────
    public List<BudgetResponse> getCurrentMonthBudgets() {
        User user = getCurrentUser();
        LocalDate now = LocalDate.now();

        List<Budget> budgets = budgetRepository
            .findByUserIdAndMonthAndYear(
                user.getId(),
                now.getMonthValue(),
                now.getYear()
            );

        return budgets.stream()
            .map(b -> toResponse(b, user.getId()))
            .toList();
    }

    // ─── GET budgets for specific month ───────────────
    public List<BudgetResponse> getBudgetsByMonth(
            Integer month, Integer year) {
        User user = getCurrentUser();

        List<Budget> budgets = budgetRepository
            .findByUserIdAndMonthAndYear(
                user.getId(), month, year);

        return budgets.stream()
            .map(b -> toResponse(b, user.getId()))
            .toList();
    }

    // ─── POST create new budget ───────────────────────
    @Transactional
    public BudgetResponse createBudget(BudgetRequest request) {
        User user = getCurrentUser();

        // Check duplicate — one budget per category per month
        budgetRepository.findByUserIdAndCategoryAndMonthAndYear(
            user.getId(),
            request.category(),
            request.month(),
            request.year()
        ).ifPresent(b -> {
            throw new BadRequestException(
                "Budget for " + request.category() +
                " already exists for this month",
                "BUDGET_ALREADY_EXISTS"
            );
        });

        Budget budget = Budget.builder()
            .user(user)
            .category(request.category())
            .limitAmount(request.limitAmount())
            .month(request.month())
            .year(request.year())
            .build();

        Budget saved = budgetRepository.save(budget);
        log.info("Budget created: {} for {}/{}",
            request.category(), request.month(), request.year());

        return toResponse(saved, user.getId());
    }

    // ─── PUT update budget limit ──────────────────────
    @Transactional
    public BudgetResponse updateBudget(
            UUID budgetId, BudgetRequest request) {
        User user = getCurrentUser();

        Budget budget = budgetRepository
            .findByIdAndUserId(budgetId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException(
                "Budget", budgetId.toString()));

        budget.setLimitAmount(request.limitAmount());
        Budget saved = budgetRepository.save(budget);

        return toResponse(saved, user.getId());
    }

    // ─── DELETE budget ────────────────────────────────
    @Transactional
    public void deleteBudget(UUID budgetId) {
        User user = getCurrentUser();

        Budget budget = budgetRepository
            .findByIdAndUserId(budgetId, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException(
                "Budget", budgetId.toString()));

        budgetRepository.delete(budget);
        log.info("Budget deleted: {}", budgetId);
    }

    // ─── GET budget summary for dashboard ─────────────
    public java.util.Map<String, Object> getBudgetSummary() {
        User user = getCurrentUser();
        LocalDate now = LocalDate.now();

        List<BudgetResponse> budgets = getBudgetsByMonth(
            now.getMonthValue(), now.getYear());

        long totalBudgets = budgets.size();
        long exceededCount = budgets.stream()
            .filter(b -> b.status().equals("EXCEEDED")).count();
        long warningCount = budgets.stream()
            .filter(b -> b.status().equals("WARNING")).count();
        long safeCount = budgets.stream()
            .filter(b -> b.status().equals("SAFE")).count();

        return java.util.Map.of(
            "totalBudgets", totalBudgets,
            "exceededCount", exceededCount,
            "warningCount", warningCount,
            "safeCount", safeCount,
            "budgets", budgets
        );
    }
}