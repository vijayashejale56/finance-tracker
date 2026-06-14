package com.financetracker.controller;

import com.financetracker.dto.request.RecurringTransactionRequest;
import com.financetracker.dto.response.ApiResponse;
import com.financetracker.dto.response.RecurringTransactionResponse;
import com.financetracker.service.RecurringTransactionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Tag(name = "Recurring Transactions",
     description = "Automate recurring income and expenses")
@RestController
@RequestMapping("/api/v1/recurring")
@RequiredArgsConstructor
public class RecurringTransactionController {

    private final RecurringTransactionService service;

    @Operation(summary = "Get all recurring transactions")
    @GetMapping
    public ResponseEntity<ApiResponse<List<RecurringTransactionResponse>>> getAll() {
        return ResponseEntity.ok(
            ApiResponse.success(service.getAll()));
    }

    @Operation(summary = "Create recurring transaction",
               description = "Set up auto-recurring income or expense")
    @PostMapping
    public ResponseEntity<ApiResponse<RecurringTransactionResponse>> create(
            @Valid @RequestBody
            RecurringTransactionRequest request) {
        return ResponseEntity.ok(
            ApiResponse.success(
                service.create(request),
                "Recurring transaction created"));
    }

    @Operation(summary = "Toggle pause/resume",
               description = "Pause or resume a recurring transaction")
    @PutMapping("/{id}/toggle")
    public ResponseEntity<ApiResponse<RecurringTransactionResponse>> toggle(
            @PathVariable UUID id) {
        return ResponseEntity.ok(
            ApiResponse.success(
                service.toggleActive(id)));
    }

    @Operation(summary = "Delete recurring transaction")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(
            @PathVariable UUID id) {
        service.delete(id);
        return ResponseEntity.ok(
            ApiResponse.success(null,
                "Recurring transaction deleted"));
    }

    // Temporary — remove after testing
  // @PostMapping("/test-execute")
  // public ResponseEntity<String> testExecute() {
  //     service.executeRecurringTransactions();
  //     return ResponseEntity.ok("Executed!");
  // }

}