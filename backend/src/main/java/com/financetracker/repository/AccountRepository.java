package com.financetracker.repository;

import com.financetracker.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface AccountRepository extends JpaRepository<Account, UUID> {
    List<Account> findByUserIdAndIsActiveTrue(UUID userId);
    Optional<Account> findByIdAndUserId(UUID id, UUID userId);
    boolean existsByIdAndUserId(UUID id, UUID userId);
}