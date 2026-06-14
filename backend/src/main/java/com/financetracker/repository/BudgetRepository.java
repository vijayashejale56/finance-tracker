package com.financetracker.repository;

import com.financetracker.entity.Budget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface BudgetRepository extends JpaRepository<Budget, UUID> {

    // Get all budgets for a user in a specific month/year
    List<Budget> findByUserIdAndMonthAndYear(
        UUID userId, Integer month, Integer year);

    // Get all budgets for a user
    List<Budget> findByUserId(UUID userId);

    // Find specific budget — to prevent duplicates
    Optional<Budget> findByUserIdAndCategoryAndMonthAndYear(
        UUID userId, String category,
        Integer month, Integer year);

    // Find budget by id and user — security check
    Optional<Budget> findByIdAndUserId(UUID id, UUID userId);

    // Get total spending for a category in a month
    // @Query("""
    //     SELECT COALESCE(SUM(t.amount), 0)
    //     FROM Transaction t
    //     JOIN t.account a
    //     WHERE a.user.id = :userId
    //     AND t.type = 'expense'
    //     AND t.category = :category
    //     AND FUNCTION('MONTH', t.transactionDate) = :month
    //     AND FUNCTION('YEAR', t.transactionDate) = :year
    // """)
    // java.math.BigDecimal getSpentAmountForCategory(
    //     @Param("userId") UUID userId,
    //     @Param("category") String category,
    //     @Param("month") Integer month,
    //     @Param("year") Integer year
    // );

    @Query("""
    SELECT COALESCE(SUM(t.amount), 0)
    FROM Transaction t
    JOIN t.account a
    WHERE a.user.id = :userId
    AND t.type = 'expense'
    AND t.category = :category
    AND EXTRACT(MONTH FROM t.transactionDate) = :month
    AND EXTRACT(YEAR FROM t.transactionDate) = :year
""")
java.math.BigDecimal getSpentAmountForCategory(
    @Param("userId") UUID userId,
    @Param("category") String category,
    @Param("month") Integer month,
    @Param("year") Integer year
);
}