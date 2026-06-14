package com.financetracker.service;

import com.financetracker.entity.User;
import com.financetracker.repository.TransactionRepository;
import com.financetracker.repository.UserRepository;
import com.financetracker.repository.BudgetRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.Month;
import java.time.format.TextStyle;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class MonthlyReportService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;
    private final EmailService emailService;

    // Runs at 8:00 AM on the 1st of every month
    // Cron: second minute hour day month weekday
    @Scheduled(cron = "0 0 8 1 * *")
    @Transactional(readOnly = true)
    public void sendMonthlyReports() {
        // Get last month's data
        LocalDate lastMonth =
            LocalDate.now().minusMonths(1);
        int month = lastMonth.getMonthValue();
        int year = lastMonth.getYear();

        String monthName = Month.of(month)
            .getDisplayName(TextStyle.FULL, Locale.ENGLISH);

        log.info("Sending monthly reports for {}/{}",
            month, year);

        List<User> allUsers = userRepository.findAll();

        for (User user : allUsers) {
            try {
                sendReportForUser(
                    user, month, year, monthName);
            } catch (Exception e) {
                log.error(
                    "Failed to send report to {}: {}",
                    user.getEmail(), e.getMessage());
            }
        }
    }

    private void sendReportForUser(
            User user, int month, int year,
            String monthName) {

        LocalDate start = LocalDate.of(year, month, 1);
        LocalDate end = start.withDayOfMonth(
            start.lengthOfMonth());

        // Calculate income and expenses
        BigDecimal income = transactionRepository
            .sumIncomeByUserAndDateRange(
                user.getId(), start, end);
        BigDecimal expenses = transactionRepository
            .sumExpenseByUserAndDateRange(
                user.getId(), start, end);
        BigDecimal savings = income.subtract(expenses);

        // Get budget statuses
        List<Map<String, String>> budgetData =
            new ArrayList<>();

        budgetRepository
            .findByUserIdAndMonthAndYear(
                user.getId(), month, year)
            .forEach(budget -> {
                BigDecimal spent = budgetRepository
                    .getSpentAmountForCategory(
                        user.getId(),
                        budget.getCategory(),
                        month, year);

                double pct = budget.getLimitAmount()
                    .compareTo(BigDecimal.ZERO) > 0
                    ? spent.divide(
                        budget.getLimitAmount(), 4,
                        java.math.RoundingMode.HALF_UP)
                        .multiply(BigDecimal.valueOf(100))
                        .doubleValue()
                    : 0.0;

                String status = pct >= 100
                    ? "EXCEEDED"
                    : pct >= 80 ? "WARNING" : "SAFE";

                budgetData.add(Map.of(
                    "category", budget.getCategory(),
                    "limit", budget.getLimitAmount()
                        .toPlainString(),
                    "spent", spent.toPlainString(),
                    "status", status
                ));
            });

        // Send email
        emailService.sendMonthlyReport(
            user.getEmail(),
            user.getFullName(),
            monthName, year,
            income.toPlainString(),
            expenses.toPlainString(),
            savings.toPlainString(),
            budgetData
        );

        log.info("Monthly report sent to {}",
            user.getEmail());
    }
}