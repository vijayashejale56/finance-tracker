package com.financetracker.service;

import com.financetracker.dto.request.AccountRequest;
import com.financetracker.dto.response.AccountResponse;
import com.financetracker.entity.Account;
import com.financetracker.entity.User;
import com.financetracker.repository.AccountRepository;
import com.financetracker.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    // Get the currently logged in user from JWT
    private User getCurrentUser() {
        String email = SecurityContextHolder.getContext()
                .getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Convert Account entity to AccountResponse DTO
    private AccountResponse toResponse(Account account) {
        return new AccountResponse(
            account.getId(),
            account.getName(),
            account.getType(),
            account.getBalance(),
            account.getCurrency(),
            account.isActive()
        );
    }

    // GET all accounts for logged in user
    public List<AccountResponse> getAllAccounts() {
        User user = getCurrentUser();
        return accountRepository
            .findByUserIdAndIsActiveTrue(user.getId())
            .stream()
            .map(this::toResponse)
            .toList();
    }

    // POST create new account
    public AccountResponse createAccount(AccountRequest request) {
        User user = getCurrentUser();

        Account account = Account.builder()
            .user(user)
            .name(request.name())
            .type(request.type())
            .balance(request.balance())
            .currency(request.currency() != null ? request.currency() : "USD")
            .build();

        return toResponse(accountRepository.save(account));
    }

    // DELETE soft delete account
    public void deleteAccount(UUID accountId) {
        User user = getCurrentUser();
        Account account = accountRepository
            .findByIdAndUserId(accountId, user.getId())
            .orElseThrow(() -> new RuntimeException("Account not found"));
        account.setActive(false);
        accountRepository.save(account);
    }
}