package com.financetracker.repository;

import com.financetracker.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

    @Query("""
        SELECT t FROM Transaction t
        JOIN t.account a
        WHERE a.user.id = :userId
        AND (:type IS NULL OR t.type = :type)
        AND (:category IS NULL OR t.category = :category)
        AND (:accountId IS NULL OR a.id = :accountId)
        AND (cast(:from as date) IS NULL OR t.transactionDate >= :from)
        AND (cast(:to as date) IS NULL OR t.transactionDate <= :to)
        ORDER BY t.transactionDate DESC, t.createdAt DESC
    """)
    Page<Transaction> findByFilters(
        @Param("userId") UUID userId,
        @Param("type") String type,
        @Param("category") String category,
        @Param("accountId") UUID accountId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to,
        Pageable pageable
    );

    @Query("""
        SELECT COALESCE(SUM(t.amount), 0)
        FROM Transaction t
        JOIN t.account a
        WHERE a.user.id = :userId
        AND t.type = 'income'
        AND t.transactionDate >= :from
        AND t.transactionDate <= :to
    """)
    BigDecimal sumIncomeByUserAndDateRange(
        @Param("userId") UUID userId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );

    @Query("""
        SELECT COALESCE(SUM(t.amount), 0)
        FROM Transaction t
        JOIN t.account a
        WHERE a.user.id = :userId
        AND t.type = 'expense'
        AND t.transactionDate >= :from
        AND t.transactionDate <= :to
    """)
    BigDecimal sumExpenseByUserAndDateRange(
        @Param("userId") UUID userId,
        @Param("from") LocalDate from,
        @Param("to") LocalDate to
    );
}


// package com.financetracker.repository;

// import com.financetracker.entity.Transaction;
// import org.springframework.data.domain.Page;
// import org.springframework.data.domain.Pageable;
// import org.springframework.data.jpa.repository.JpaRepository;
// import org.springframework.data.jpa.repository.Query;
// import org.springframework.data.repository.query.Param;

// import java.time.LocalDate;
// import java.util.UUID;

// public interface TransactionRepository extends JpaRepository<Transaction, UUID> {

//     // Get all transactions for a user with optional filters
//     @Query("""
//         SELECT t FROM Transaction t
//         JOIN t.account a
//         WHERE a.user.id = :userId
//         AND (:type IS NULL OR t.type = :type)
//         AND (:category IS NULL OR t.category = :category)
//         AND (:accountId IS NULL OR a.id = :accountId)
//         AND (:from IS NULL OR t.transactionDate >= :from)
//         AND (:to IS NULL OR t.transactionDate <= :to)
//         ORDER BY t.transactionDate DESC, t.createdAt DESC
//     """)
//     Page<Transaction> findByFilters(
//         @Param("userId") UUID userId,
//         @Param("type") String type,
//         @Param("category") String category,
//         @Param("accountId") UUID accountId,
//         @Param("from") LocalDate from,
//         @Param("to") LocalDate to,
//         Pageable pageable
//     );

//     // Total income for a user in a date range
//     @Query("""
//         SELECT COALESCE(SUM(t.amount), 0)
//         FROM Transaction t
//         JOIN t.account a
//         WHERE a.user.id = :userId
//         AND t.type = 'income'
//         AND t.transactionDate >= :from
//         AND t.transactionDate <= :to
//     """)
//     java.math.BigDecimal sumIncomeByUserAndDateRange(
//         @Param("userId") UUID userId,
//         @Param("from") LocalDate from,
//         @Param("to") LocalDate to
//     );

//     // Total expenses for a user in a date range
//     @Query("""
//         SELECT COALESCE(SUM(t.amount), 0)
//         FROM Transaction t
//         JOIN t.account a
//         WHERE a.user.id = :userId
//         AND t.type = 'expense'
//         AND t.transactionDate >= :from
//         AND t.transactionDate <= :to
//     """)
//     java.math.BigDecimal sumExpenseByUserAndDateRange(
//         @Param("userId") UUID userId,
//         @Param("from") LocalDate from,
//         @Param("to") LocalDate to
//     );
// }