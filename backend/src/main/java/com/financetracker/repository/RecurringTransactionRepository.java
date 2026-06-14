package com.financetracker.repository;

import com.financetracker.entity.RecurringTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RecurringTransactionRepository
        extends JpaRepository<RecurringTransaction, UUID> {

    // Used by scheduler every night
    List<RecurringTransaction> findByNextDueDateAndIsActiveTrue(
        LocalDate nextDueDate);

    // Get all for a user — security
    @Query("""
        SELECT r FROM RecurringTransaction r
        JOIN FETCH r.account
        WHERE r.user.id = :userId
        ORDER BY r.nextDueDate ASC
    """)
    List<RecurringTransaction> findByUserIdWithAccount(
        @Param("userId") UUID userId);

    // Security check — get one only if it belongs to user
    Optional<RecurringTransaction> findByIdAndUserId(
        UUID id, UUID userId);
}