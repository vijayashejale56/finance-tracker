package com.financetracker.service;

import com.financetracker.dto.request.RecurringTransactionRequest;
import com.financetracker.dto.request.TransactionRequest;
import com.financetracker.dto.response.RecurringTransactionResponse;
import com.financetracker.entity.Account;
import com.financetracker.entity.RecurringTransaction;
import com.financetracker.entity.User;
import com.financetracker.exception.BadRequestException;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.repository.AccountRepository;
import com.financetracker.repository.RecurringTransactionRepository;
import com.financetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;


import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@Transactional
@RequiredArgsConstructor
public class RecurringTransactionService {

    private final RecurringTransactionRepository recurringRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionService transactionService;

    // ─── Get current user ─────────────────────────────
    private User getCurrentUser() {
        String email = SecurityContextHolder
            .getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() ->
                new ResourceNotFoundException("User", email));
    }

    // ─── Convert entity to response ───────────────────
    private RecurringTransactionResponse toResponse(
            RecurringTransaction r) {
        long daysUntil = ChronoUnit.DAYS.between(
            LocalDate.now(), r.getNextDueDate());

        return new RecurringTransactionResponse(
            r.getId(),
            r.getAccount().getId(),
            r.getAccount().getName(),
            r.getType(),
            r.getAmount(),
            r.getCurrency(),
            r.getCategory(),
            r.getDescription(),
            r.getFrequency(),
            r.getDayOfMonth(),
            r.getNextDueDate(),
            r.getLastExecutedDate(),
            r.isActive(),
            Math.max(0, daysUntil)
        );
    }

    // ─── Calculate when to run next ───────────────────
    // This is called after every execution
    private LocalDate calculateNextDueDate(
            RecurringTransaction r) {
        LocalDate current = r.getNextDueDate();

        return switch (r.getFrequency()) {
            case "DAILY"   -> current.plusDays(1);
            case "WEEKLY"  -> current.plusWeeks(1);
            case "YEARLY"  -> current.plusYears(1);
            // MONTHLY — go to same day next month
            default -> {
                LocalDate next = current.plusMonths(1);
                // Handle months with fewer days
                // e.g. dayOfMonth=31 but next month has 30
                if (r.getDayOfMonth() != null) {
                    int maxDay = next.lengthOfMonth();
                    int targetDay = Math.min(
                        r.getDayOfMonth(), maxDay);
                    yield next.withDayOfMonth(targetDay);
                }
                yield next;
            }
        };
    }

    // ─── Calculate first due date from startDate ──────
    private LocalDate calculateFirstDueDate(
            RecurringTransactionRequest request) {

        LocalDate start = request.startDate();

        if ("MONTHLY".equals(request.frequency()) &&
                request.dayOfMonth() != null) {
            // Set to the specified day of the start month
            int maxDay = start.lengthOfMonth();
            int day = Math.min(
                request.dayOfMonth(), maxDay);
            LocalDate firstDate =
                start.withDayOfMonth(day);
            // If that day already passed this month
            // move to next month
            if (firstDate.isBefore(LocalDate.now())) {
                firstDate = firstDate.plusMonths(1);
            }
            return firstDate;
        }

        return start.isBefore(LocalDate.now())
            ? LocalDate.now() : start;
    }

    // ─── GET all recurring for current user ───────────
    @Transactional(readOnly = true)
    public List<RecurringTransactionResponse> getAll() {
        User user = getCurrentUser();
        return recurringRepository
            .findByUserIdWithAccount(user.getId())
            .stream()
            .map(this::toResponse)
            .toList();
    }

    // ─── POST create recurring ────────────────────────
    public RecurringTransactionResponse create(
            RecurringTransactionRequest request) {
        User user = getCurrentUser();

        // Validate type
        if (!request.type().equals("income") &&
                !request.type().equals("expense")) {
            throw new BadRequestException(
                "Recurring type must be income or expense",
                "INVALID_TYPE");
        }

        // Find account — security check
        Account account = accountRepository
            .findByIdAndUserId(
                request.accountId(), user.getId())
            .orElseThrow(() ->
                new ResourceNotFoundException(
                    "Account",
                    request.accountId().toString()));

        LocalDate firstDueDate =
            calculateFirstDueDate(request);

        RecurringTransaction recurring =
            RecurringTransaction.builder()
                .user(user)
                .account(account)
                .type(request.type())
                .amount(request.amount())
                .currency(request.currency() != null
                    ? request.currency()
                    : account.getCurrency())
                .category(request.category())
                .description(request.description())
                .frequency(request.frequency())
                .dayOfMonth(request.dayOfMonth())
                .nextDueDate(firstDueDate)
                .build();

        RecurringTransaction saved =
            recurringRepository.save(recurring);

        log.info("Recurring transaction created: {} {} on {}",
            request.type(), request.amount(),
            request.frequency());

        return toResponse(saved);
    }

    // ─── PUT toggle active/paused ─────────────────────
    public RecurringTransactionResponse toggleActive(
            UUID id) {
        User user = getCurrentUser();

        RecurringTransaction recurring =
            recurringRepository.findByIdAndUserId(
                id, user.getId())
            .orElseThrow(() ->
                new ResourceNotFoundException(
                    "RecurringTransaction", id.toString()));

        // Flip the active state
        recurring.setActive(!recurring.isActive());
        RecurringTransaction saved =
            recurringRepository.save(recurring);

        log.info("Recurring {} — active: {}",
            id, saved.isActive());
        return toResponse(saved);
    }

    // ─── DELETE recurring ─────────────────────────────
    public void delete(UUID id) {
        User user = getCurrentUser();

        RecurringTransaction recurring =
            recurringRepository.findByIdAndUserId(
                id, user.getId())
            .orElseThrow(() ->
                new ResourceNotFoundException(
                    "RecurringTransaction", id.toString()));

        recurringRepository.delete(recurring);
        log.info("Recurring transaction deleted: {}", id);
    }

    // ─── THE SCHEDULER ────────────────────────────────
    // Runs every day at midnight automatically
    // Checks all recurring transactions due today
    // Creates actual transactions for each one
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void executeRecurringTransactions() {
        LocalDate today = LocalDate.now();
        log.info("Running recurring transactions for {}",
            today);

        // Find all active recurring transactions due today
        List<RecurringTransaction> dueToday =
            recurringRepository
                .findByNextDueDateAndIsActiveTrue(today);

        log.info("Found {} recurring transactions due today",
            dueToday.size());

        for (RecurringTransaction recurring : dueToday) {
            try {
                // Create actual transaction
                // Reuses TransactionService — same logic
                // as if user manually added it
                TransactionRequest txRequest =
                    new TransactionRequest(
                        recurring.getAccount().getId(),
                        recurring.getType(),
                        recurring.getAmount(),
                        recurring.getCurrency(),
                        recurring.getCategory(),
                        recurring.getDescription() != null
                            ? "[Auto] " +
                              recurring.getDescription()
                            : "[Auto] " +
                              recurring.getFrequency()
                              .toLowerCase() + " " +
                              recurring.getType(),
                        today,
                        null // no transfer account
                    );

                // Set security context for this user
                // TransactionService needs current user
                // org.springframework.security.core.userdetails.User userDetails =
                //     org.springframework.security.core.userdetails.User
                //     .withUsername(
                //             recurring.getUser().getEmail())
                //         .password("")
                //         .roles("USER")
                //         .build();

                // var auth = new org.springframework.security
                //     .authentication
                //     .UsernamePasswordAuthenticationToken(
                //         userDetails, null,
                //         userDetails.getAuthorities());

                // org.springframework.security.core.context
                //     .SecurityContextHolder.getContext()
                //     .setAuthentication(auth);

                // Set security context for this user so
// TransactionService knows who is calling
org.springframework.security.core.userdetails
    .UserDetails userDetails =
    org.springframework.security.core.userdetails.User
        .withUsername(
            recurring.getUser().getEmail())
        .password("")
        .roles("USER")
        .build();

var auth = new org.springframework.security
    .authentication
    .UsernamePasswordAuthenticationToken(
        userDetails, null,
        userDetails.getAuthorities());

org.springframework.security.core.context
    .SecurityContextHolder.getContext()
    .setAuthentication(auth);

                transactionService.createTransaction(txRequest);

                // Update last executed and next due date
                recurring.setLastExecutedDate(today);
                recurring.setNextDueDate(
                    calculateNextDueDate(recurring));
                recurringRepository.save(recurring);

                log.info(
                    "Executed recurring: {} {} for {}",
                    recurring.getType(),
                    recurring.getAmount(),
                    recurring.getUser().getEmail());

            } catch (Exception e) {
                log.error(
                    "Failed to execute recurring {}: {}",
                    recurring.getId(), e.getMessage());
                // Continue with next — don't stop all
                // if one fails
            }
        }

        log.info("Recurring execution complete for {}",
            today);
    }
}