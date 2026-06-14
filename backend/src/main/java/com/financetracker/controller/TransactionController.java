package com.financetracker.controller;

import com.financetracker.dto.request.TransactionRequest;
import com.financetracker.dto.response.PageResponse;
import com.financetracker.dto.response.TransactionResponse;
import com.financetracker.service.TransactionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import java.util.List;
import java.util.Map;

@Tag(name = "Transactions",
     description = "Manage income, expenses and transfers")
@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

    @Operation(summary = "Get all transactions",
               description = "Paginated list with optional filters")
    @GetMapping
    public ResponseEntity<PageResponse<TransactionResponse>> getTransactions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) UUID accountId,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) 
            LocalDate to,

            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @RequestParam(defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir
        
        ) {

        return ResponseEntity.ok(
            transactionService.getTransactions(
                page, size, type, category, accountId, from, to, keyword, minAmount, maxAmount, sortBy, sortDir)
        );
    }

    @Operation(summary = "Create transaction",
               description = "Add income, expense or transfer")
    @PostMapping
    public ResponseEntity<TransactionResponse> createTransaction(
            @Valid @RequestBody TransactionRequest request) {
        return ResponseEntity.ok(
            transactionService.createTransaction(request));
    }

    @Operation(summary = "Delete transaction",
               description = "Delete and reverse account balance")
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable UUID id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Monthly summary",
               description = "Total income, expense and savings this month")
    @GetMapping("/monthly-summary")
    public ResponseEntity<Map<String, BigDecimal>> getMonthlySummary() {
        return ResponseEntity.ok(transactionService.getMonthlySummary());
    }

    @Operation(summary = "Spending by category",
               description = "Expense breakdown for pie chart")
    @GetMapping("/spending-by-category")
    public ResponseEntity<List<Map<String, Object>>> getSpendingByCategory(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
        return ResponseEntity.ok(
            transactionService.getSpendingByCategory(from, to));
    }

    @Operation(summary = "Monthly trend",
               description = "6 months income vs expense for charts")
    @GetMapping("/monthly-trend")
    public ResponseEntity<List<Map<String, Object>>> getMonthlyTrend() {
        return ResponseEntity.ok(transactionService.getMonthlyTrend());
    }
    
}