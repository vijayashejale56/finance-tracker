package com.financetracker.repository;

import com.financetracker.entity.Goal;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface GoalRepository
        extends JpaRepository<Goal, UUID> {

    // Get all goals for a user — ordered newest first
    List<Goal> findByUserIdOrderByCreatedAtDesc(UUID userId);

    // Get goals by status — IN_PROGRESS or COMPLETED
    List<Goal> findByUserIdAndStatus(
        UUID userId, String status);

    // Security check — get goal only if it belongs to user
    Optional<Goal> findByIdAndUserId(UUID id, UUID userId);

    // Check duplicate name per user
    boolean existsByUserIdAndName(UUID userId, String name);
}