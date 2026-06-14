package com.financetracker.service;

import com.financetracker.dto.request.TransactionRequest;
import com.financetracker.dto.response.TransactionResponse;
import com.financetracker.entity.Account;
import com.financetracker.entity.Transaction;
import com.financetracker.entity.User;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.helper.TestDataFactory;
import com.financetracker.repository.AccountRepository;
import com.financetracker.repository.TransactionRepository;
import com.financetracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.*;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TransactionService Tests")
class TransactionServiceTest {

    @Mock private TransactionRepository transactionRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private UserRepository userRepository;
    @Mock private SecurityContext securityContext;
    @Mock private Authentication authentication;

    @InjectMocks private TransactionService transactionService;

    private User testUser;
    private Account testAccount;

    @BeforeEach
    void setUp() {
        testUser = TestDataFactory.createUser();
        testAccount = TestDataFactory.createAccount(testUser);

        when(securityContext.getAuthentication())
            .thenReturn(authentication);
        when(authentication.getName())
            .thenReturn(testUser.getEmail());
        SecurityContextHolder.setContext(securityContext);

        when(userRepository.findByEmail(testUser.getEmail()))
            .thenReturn(Optional.of(testUser));
    }

    @Nested
    @DisplayName("createTransaction() — Balance Updates")
    class CreateTransactionTests {

        @Test
        @DisplayName("Expense should DECREASE account balance")
        void createTransaction_Expense_DecreasesBalance() {
            // ARRANGE
            BigDecimal initialBalance = BigDecimal.valueOf(50000);
            testAccount.setBalance(initialBalance);

            TransactionRequest request =
                TestDataFactory.createExpenseRequest(testAccount.getId());

            when(accountRepository.findByIdAndUserId(
                testAccount.getId(), testUser.getId()))
                .thenReturn(Optional.of(testAccount));

            Transaction savedTransaction = Transaction.builder()
                .id(UUID.randomUUID())
                .account(testAccount)
                .type("expense")
                .amount(BigDecimal.valueOf(1000))
                .currency("INR")
                .category("Food")
                .transactionDate(LocalDate.now())
                .status("cleared")
                .createdAt(Instant.now())
                .build();

            when(transactionRepository.save(any()))
                .thenReturn(savedTransaction);

            // ACT
            transactionService.createTransaction(request);

            // ASSERT — balance decreased by expense amount
            ArgumentCaptor<Account> accountCaptor =
                ArgumentCaptor.forClass(Account.class);
            verify(accountRepository).save(accountCaptor.capture());

            BigDecimal expectedBalance =
                initialBalance.subtract(BigDecimal.valueOf(1000));
            assertThat(accountCaptor.getValue().getBalance())
                .isEqualByComparingTo(expectedBalance);
        }

        @Test
        @DisplayName("Income should INCREASE account balance")
        void createTransaction_Income_IncreasesBalance() {
            // ARRANGE
            BigDecimal initialBalance = BigDecimal.valueOf(50000);
            testAccount.setBalance(initialBalance);

            TransactionRequest request =
                TestDataFactory.createIncomeRequest(testAccount.getId());

            when(accountRepository.findByIdAndUserId(
                testAccount.getId(), testUser.getId()))
                .thenReturn(Optional.of(testAccount));

            Transaction savedTransaction = Transaction.builder()
                .id(UUID.randomUUID())
                .account(testAccount)
                .type("income")
                .amount(BigDecimal.valueOf(85000))
                .currency("INR")
                .category("Salary")
                .transactionDate(LocalDate.now())
                .status("cleared")
                .createdAt(Instant.now())
                .build();

            when(transactionRepository.save(any()))
                .thenReturn(savedTransaction);

            // ACT
            transactionService.createTransaction(request);

            // ASSERT — balance increased by income amount
            ArgumentCaptor<Account> captor =
                ArgumentCaptor.forClass(Account.class);
            verify(accountRepository).save(captor.capture());

            BigDecimal expectedBalance =
                initialBalance.add(BigDecimal.valueOf(85000));
            assertThat(captor.getValue().getBalance())
                .isEqualByComparingTo(expectedBalance);
        }

        @Test
        @DisplayName("Transfer should deduct from source and add to destination")
        void createTransaction_Transfer_UpdatesBothAccounts() {
            // ARRANGE
            Account sourceAccount = TestDataFactory.createAccount(testUser);
            sourceAccount.setBalance(BigDecimal.valueOf(50000));

            Account destAccount = TestDataFactory.createAccount(testUser);
            destAccount.setBalance(BigDecimal.valueOf(10000));

            TransactionRequest request = new TransactionRequest(
                sourceAccount.getId(),
                "transfer",
                BigDecimal.valueOf(20000),
                "INR", "Transfer", "Test transfer",
                LocalDate.now(),
                destAccount.getId()
            );

            when(accountRepository.findByIdAndUserId(
                sourceAccount.getId(), testUser.getId()))
                .thenReturn(Optional.of(sourceAccount));
            when(accountRepository.findByIdAndUserId(
                destAccount.getId(), testUser.getId()))
                .thenReturn(Optional.of(destAccount));

            Transaction savedTransaction = Transaction.builder()
                .id(UUID.randomUUID())
                .account(sourceAccount)
                .type("transfer")
                .amount(BigDecimal.valueOf(20000))
                .currency("INR")
                .transactionDate(LocalDate.now())
                .status("cleared")
                .createdAt(Instant.now())
                .build();

            when(transactionRepository.save(any()))
                .thenReturn(savedTransaction);

            // ACT
            transactionService.createTransaction(request);

            // ASSERT
            // Source reduced by 20000: 50000 - 20000 = 30000
            assertThat(sourceAccount.getBalance())
                .isEqualByComparingTo(BigDecimal.valueOf(30000));

            // Destination increased by 20000: 10000 + 20000 = 30000
            assertThat(destAccount.getBalance())
                .isEqualByComparingTo(BigDecimal.valueOf(30000));

            // Both accounts saved
            verify(accountRepository, times(2)).save(any(Account.class));
        }

        @Test
        @DisplayName("Should throw exception for account not belonging to user")
        void createTransaction_WithOtherUsersAccount_ThrowsException() {
            // ARRANGE
            TransactionRequest request =
                TestDataFactory.createExpenseRequest(UUID.randomUUID());

            when(accountRepository.findByIdAndUserId(any(), any()))
                .thenReturn(Optional.empty());

            // ACT + ASSERT
            assertThrows(
                ResourceNotFoundException.class,
                () -> transactionService.createTransaction(request)
            );

            // Transaction should never be saved
            verify(transactionRepository, never()).save(any());
        }
    }
}