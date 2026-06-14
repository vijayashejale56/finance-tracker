package com.financetracker.service;

import com.financetracker.dto.request.ContributeRequest;
import com.financetracker.dto.request.GoalRequest;
import com.financetracker.dto.response.GoalResponse;
import com.financetracker.entity.Account;
import com.financetracker.entity.Goal;
import com.financetracker.entity.User;
import com.financetracker.exception.BadRequestException;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.repository.AccountRepository;
import com.financetracker.repository.GoalRepository;
import com.financetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.time.Instant;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class GoalService {

    private final GoalRepository goalRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final EmailService emailService;

    // ─── Get current logged in user ──────────────────
    private User getCurrentUser() {
        String email = SecurityContextHolder
            .getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() ->
                new ResourceNotFoundException("User", email));
    }

    // ─── The Smart Calculation ────────────────────────
    // Compares actual progress vs expected progress
    private String calculateTrackingStatus(
            BigDecimal current, BigDecimal target,
            LocalDate deadline, Instant createdAt) {

        // Already completed
        if (current.compareTo(target) >= 0)
            return "COMPLETED";

          if (createdAt == null) return "ON_TRACK";

        LocalDate today = LocalDate.now();
        LocalDate start = createdAt
            .atZone(java.time.ZoneId.systemDefault())
            .toLocalDate();

        long totalDays = ChronoUnit.DAYS.between(
            start, deadline);
        long passedDays = ChronoUnit.DAYS.between(
            start, today);

        if (totalDays <= 0) return "BEHIND";

        // What % of time has passed
        double timePassedPct =
            (double) passedDays / totalDays * 100;

        // What % of target is saved
        double savedPct = current
            .divide(target, 4, RoundingMode.HALF_UP)
            .multiply(BigDecimal.valueOf(100))
            .doubleValue();

        // If saved more than time passed → ON TRACK
        // Example: 65% saved, 40% time passed → ON TRACK
        // Example: 30% saved, 60% time passed → BEHIND
        return savedPct >= timePassedPct
            ? "ON_TRACK" : "BEHIND";
    }

    // ─── Convert entity to response ───────────────────
    @Transactional(readOnly = true)
    private GoalResponse toResponse(Goal goal) {
        // If linked to account — use account balance
        BigDecimal current = goal.getLinkedAccount() != null
            ? goal.getLinkedAccount().getBalance()
            : goal.getCurrentAmount();

        BigDecimal target = goal.getTargetAmount();
        BigDecimal remaining = target.subtract(current)
            .max(BigDecimal.ZERO);

        // Percentage complete (capped at 100)
        double pct = target.compareTo(BigDecimal.ZERO) > 0
            ? Math.min(100.0, current
                .divide(target, 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100))
                .doubleValue())
            : 0.0;

        // Days and months remaining
        long daysLeft = ChronoUnit.DAYS.between(
            LocalDate.now(), goal.getDeadline());
        long monthsLeft = ChronoUnit.MONTHS.between(
            LocalDate.now(), goal.getDeadline());

        // How much to save per month to reach goal
        BigDecimal monthlyRequired = BigDecimal.ZERO;
        if (monthsLeft > 0 &&
                remaining.compareTo(BigDecimal.ZERO) > 0) {
            monthlyRequired = remaining.divide(
                BigDecimal.valueOf(monthsLeft),
                2, RoundingMode.CEILING);
        }

        String trackingStatus = calculateTrackingStatus(
            current, target,
            goal.getDeadline(), goal.getCreatedAt());

        return new GoalResponse(
            goal.getId(),
            goal.getName(),
            target,
            current,
            remaining,
            Math.round(pct * 100.0) / 100.0,
            goal.getDeadline(),
            Math.max(0, daysLeft),
            Math.max(0, monthsLeft),
            monthlyRequired,
            goal.getStatus(),
            trackingStatus,
            goal.getNotes(),
            goal.getLinkedAccount() != null
                ? goal.getLinkedAccount().getId() : null,
            goal.getLinkedAccount() != null
                ? goal.getLinkedAccount().getName() : null
        );
    }

    // ─── GET all goals ────────────────────────────────
    @Transactional(readOnly = true)
    public List<GoalResponse> getAllGoals() {
        User user = getCurrentUser();
        return goalRepository
            .findByUserIdOrderByCreatedAtDesc(user.getId())
            .stream()
            .map(this::toResponse)
            .toList();
    }

    // ─── POST create goal ─────────────────────────────
    public GoalResponse createGoal(GoalRequest request) {
        User user = getCurrentUser();

        // Check duplicate name
        if (goalRepository.existsByUserIdAndName(
                user.getId(), request.name())) {
            throw new BadRequestException(
                "Goal '" + request.name() +
                "' already exists",
                "GOAL_ALREADY_EXISTS");
        }

        // Validate deadline is in the future
        if (!request.deadline().isAfter(LocalDate.now())) {
            throw new BadRequestException(
                "Deadline must be in the future",
                "INVALID_DEADLINE");
        }

        // Find linked account if provided
        Account linkedAccount = null;
        if (request.linkedAccountId() != null) {
            linkedAccount = accountRepository
                .findByIdAndUserId(
                    request.linkedAccountId(),
                    user.getId())
                .orElseThrow(() ->
                    new ResourceNotFoundException(
                        "Account",
                        request.linkedAccountId()
                            .toString()));
        }

        Goal goal = Goal.builder()
            .user(user)
            .name(request.name())
            .targetAmount(request.targetAmount())
            .currentAmount(request.currentAmount() != null
                ? request.currentAmount()
                : BigDecimal.ZERO)
            .deadline(request.deadline())
            .linkedAccount(linkedAccount)
            .notes(request.notes())
            .build();

        Goal saved = goalRepository.save(goal);
        log.info("Goal created: {} for user {}",
            request.name(), user.getEmail());

        return toResponse(saved);
    }

    // ─── PUT update goal ──────────────────────────────
    public GoalResponse updateGoal(
            UUID goalId, GoalRequest request) {
        User user = getCurrentUser();

        Goal goal = goalRepository
            .findByIdAndUserId(goalId, user.getId())
            .orElseThrow(() ->
                new ResourceNotFoundException(
                    "Goal", goalId.toString()));

        goal.setTargetAmount(request.targetAmount());
        goal.setDeadline(request.deadline());
        goal.setNotes(request.notes());

        if (request.currentAmount() != null) {
            goal.setCurrentAmount(request.currentAmount());
        }

        // Check if now completed
        if (goal.getCurrentAmount().compareTo(
                goal.getTargetAmount()) >= 0) {
            goal.setStatus("COMPLETED");
        }

        return toResponse(goalRepository.save(goal));
    }

    // ─── PUT contribute to goal ───────────────────────
    // User adds money towards goal manually
    public GoalResponse contribute(
            UUID goalId, ContributeRequest request) {
        User user = getCurrentUser();

        Goal goal = goalRepository
            .findByIdAndUserId(goalId, user.getId())
            .orElseThrow(() ->
                new ResourceNotFoundException(
                    "Goal", goalId.toString()));

        if (goal.getStatus().equals("COMPLETED")) {
            throw new BadRequestException(
                "Goal is already completed",
                "GOAL_ALREADY_COMPLETED");
        }

        // Add contribution to current amount
        BigDecimal newAmount = goal.getCurrentAmount()
            .add(request.amount());
        goal.setCurrentAmount(newAmount);

        // Auto-complete if target reached
        boolean justCompleted = false;
        if (newAmount.compareTo(
                goal.getTargetAmount()) >= 0) {
            goal.setStatus("COMPLETED");
            justCompleted = true;
            log.info("Goal completed: {} for {}",
                goal.getName(), user.getEmail());
        }

        Goal saved = goalRepository.save(goal);

        // Send congratulations email if just completed
        if (justCompleted) {
            emailService.sendEmail(
                user.getEmail(),
                "🎉 Goal Completed: " + goal.getName(),
                "welcome", // reuse template for now
                java.util.Map.of(
                    "fullName", user.getFullName()
                )
            );
        }

        return toResponse(saved);
    }

    // ─── DELETE goal ──────────────────────────────────
    public void deleteGoal(UUID goalId) {
        User user = getCurrentUser();

        Goal goal = goalRepository
            .findByIdAndUserId(goalId, user.getId())
            .orElseThrow(() ->
                new ResourceNotFoundException(
                    "Goal", goalId.toString()));

        goalRepository.delete(goal);
        log.info("Goal deleted: {}", goalId);
    }

    // ─── GET summary for dashboard ────────────────────
    @Transactional(readOnly = true)
    public java.util.Map<String, Object> getGoalSummary() {
        User user = getCurrentUser();
        List<GoalResponse> goals = getAllGoals();

        long total = goals.size();
        long completed = goals.stream()
            .filter(g -> g.status()
                .equals("COMPLETED")).count();
        long onTrack = goals.stream()
            .filter(g -> g.trackingStatus()
                .equals("ON_TRACK")).count();
        long behind = goals.stream()
            .filter(g -> g.trackingStatus()
                .equals("BEHIND")).count();

        return java.util.Map.of(
            "total", total,
            "completed", completed,
            "onTrack", onTrack,
            "behind", behind,
            "goals", goals
        );
    }
}