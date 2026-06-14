package com.financetracker.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "recurring_transactions")
@Getter @Setter @NoArgsConstructor
@AllArgsConstructor @Builder
public class RecurringTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Who owns this recurring template
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Which account to debit or credit
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(nullable = false)
    private String type; // income or expense

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Builder.Default
    @Column(nullable = false)
    private String currency = "INR";

    private String category;
    private String description;

    // How often it repeats
    @Column(nullable = false)
    private String frequency; // DAILY/WEEKLY/MONTHLY/YEARLY

    // For MONTHLY — which day (1=1st, 15=15th etc)
    @Column(name = "day_of_month")
    private Integer dayOfMonth;

    // When to run next — scheduler checks this daily
    @Column(name = "next_due_date", nullable = false)
    private LocalDate nextDueDate;

    // When it last ran — for tracking history
    @Column(name = "last_executed_date")
    private LocalDate lastExecutedDate;

    // Pause without deleting
    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}