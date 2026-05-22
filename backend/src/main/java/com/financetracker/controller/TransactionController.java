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

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;

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
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        return ResponseEntity.ok(
            transactionService.getTransactions(
                page, size, type, category, accountId, from, to)
        );
    }

    @PostMapping
    public ResponseEntity<TransactionResponse> createTransaction(
            @Valid @RequestBody TransactionRequest request) {
        return ResponseEntity.ok(
            transactionService.createTransaction(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable UUID id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/monthly-summary")
    public ResponseEntity<Map<String, BigDecimal>> getMonthlySummary() {
        return ResponseEntity.ok(transactionService.getMonthlySummary());
    }

    @GetMapping("/spending-by-category")
public ResponseEntity<List<Map<String, Object>>> getSpendingByCategory(
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
        @RequestParam(required = false)
        @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {
    return ResponseEntity.ok(
        transactionService.getSpendingByCategory(from, to));
}

@GetMapping("/monthly-trend")
public ResponseEntity<List<Map<String, Object>>> getMonthlyTrend() {
    return ResponseEntity.ok(transactionService.getMonthlyTrend());
}
}