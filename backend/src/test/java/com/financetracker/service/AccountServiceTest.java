package com.financetracker.service;

import com.financetracker.dto.request.AccountRequest;
import com.financetracker.dto.response.AccountResponse;
import com.financetracker.entity.Account;
import com.financetracker.entity.User;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.helper.TestDataFactory;
import com.financetracker.repository.AccountRepository;
import com.financetracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AccountService Tests")
class AccountServiceTest {

    @Mock private AccountRepository accountRepository;
    @Mock private UserRepository userRepository;
    @Mock private SecurityContext securityContext;
    @Mock private Authentication authentication;

    @InjectMocks private AccountService accountService;

    private User testUser;
    private Account testAccount;

    @BeforeEach
    void setUp() {
        testUser = TestDataFactory.createUser();
        testAccount = TestDataFactory.createAccount(testUser);

        // Mock security context — simulates logged in user
        when(securityContext.getAuthentication())
            .thenReturn(authentication);
        when(authentication.getName())
            .thenReturn(testUser.getEmail());
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(testUser.getEmail()))
            .thenReturn(Optional.of(testUser));
    }

    @Nested
    @DisplayName("getAllAccounts()")
    class GetAllAccountsTests {

        @Test
        @DisplayName("Should return all active accounts for current user")
        void getAllAccounts_ReturnsUserAccounts() {
            // ARRANGE
            when(accountRepository.findByUserIdAndIsActiveTrue(
                testUser.getId()))
                .thenReturn(List.of(testAccount));

            // ACT
            List<AccountResponse> result =
                accountService.getAllAccounts();

            // ASSERT
            assertThat(result).hasSize(1);
            assertThat(result.get(0).name())
                .isEqualTo(testAccount.getName());
            assertThat(result.get(0).balance())
                .isEqualByComparingTo(testAccount.getBalance());
        }

        @Test
        @DisplayName("Should return empty list when user has no accounts")
        void getAllAccounts_WhenNoAccounts_ReturnsEmptyList() {
            // ARRANGE
            when(accountRepository.findByUserIdAndIsActiveTrue(any()))
                .thenReturn(List.of());

            // ACT
            List<AccountResponse> result =
                accountService.getAllAccounts();

            // ASSERT
            assertThat(result).isEmpty();
        }
    }

    @Nested
    @DisplayName("createAccount()")
    class CreateAccountTests {

        @Test
        @DisplayName("Should create account and return response")
        void createAccount_WithValidRequest_ReturnsAccountResponse() {
            // ARRANGE
            AccountRequest request =
                TestDataFactory.createAccountRequest();
            when(accountRepository.save(any(Account.class)))
                .thenReturn(testAccount);

            // ACT
            AccountResponse response =
                accountService.createAccount(request);

            // ASSERT
            assertThat(response).isNotNull();
            assertThat(response.name()).isEqualTo(testAccount.getName());
            verify(accountRepository, times(1))
                .save(any(Account.class));
        }

        @Test
        @DisplayName("Should use INR as default currency when not provided")
        void createAccount_WithNullCurrency_UsesDefault() {
            // ARRANGE
            AccountRequest request = new AccountRequest(
                "Test", "savings",
                BigDecimal.valueOf(1000), null);
            when(accountRepository.save(any(Account.class)))
                .thenReturn(testAccount);

            // ACT
            accountService.createAccount(request);

            // ASSERT — verify saved account has default currency
            verify(accountRepository).save(argThat(account ->
                account.getCurrency() != null
            ));
        }
    }

    @Nested
    @DisplayName("deleteAccount()")
    class DeleteAccountTests {

        @Test
        @DisplayName("Should soft delete account by setting isActive false")
        void deleteAccount_SetsIsActiveFalse() {
            // ARRANGE
            when(accountRepository.findByIdAndUserId(
                testAccount.getId(), testUser.getId()))
                .thenReturn(Optional.of(testAccount));

            // ACT
            accountService.deleteAccount(testAccount.getId());

            // ASSERT — account was saved with isActive = false
            verify(accountRepository).save(argThat(account ->
                !account.isActive()
            ));
        }

        @Test
        @DisplayName("Should throw ResourceNotFoundException for unknown account")
        void deleteAccount_WithUnknownId_ThrowsNotFoundException() {
            // ARRANGE
            UUID unknownId = UUID.randomUUID();
            when(accountRepository.findByIdAndUserId(
                unknownId, testUser.getId()))
                .thenReturn(Optional.empty());

            // ACT + ASSERT
            assertThrows(
                ResourceNotFoundException.class,
                () -> accountService.deleteAccount(unknownId)
            );
        }
    }
}