package com.financetracker.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "transactions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "account_id", nullable = false)
    private Account account;

    @Column(nullable = false)
    private String type;

    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal amount;

    @Builder.Default
    @Column(nullable = false)
    private String currency = "USD";

    private String category;
    private String description;

    @Column(name = "transaction_date", nullable = false)
    private LocalDate transactionDate;

    @Builder.Default
    @Column(nullable = false)
    private String status = "cleared";

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "transfer_to_account_id")
    private Account transferToAccount;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private Instant createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private Instant updatedAt;
}