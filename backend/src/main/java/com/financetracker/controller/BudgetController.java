package com.financetracker.controller;

import com.financetracker.dto.request.BudgetRequest;
import com.financetracker.dto.response.ApiResponse;
import com.financetracker.dto.response.BudgetResponse;
import com.financetracker.service.BudgetService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Budgets",
     description = "Set and track monthly spending limits")
@RestController
@RequestMapping("/api/v1/budgets")
@RequiredArgsConstructor
public class BudgetController {

    private final BudgetService budgetService;

    @Operation(summary = "Get current month budgets",
               description = "Returns all budgets with spending status")
    @GetMapping
    public ResponseEntity<ApiResponse<List<BudgetResponse>>>
            getCurrentBudgets() {
        return ResponseEntity.ok(ApiResponse.success(
            budgetService.getCurrentMonthBudgets()));
    }

    @Operation(summary = "Get budgets by month")
    @GetMapping("/month/{year}/{month}")
    public ResponseEntity<ApiResponse<List<BudgetResponse>>>
            getBudgetsByMonth(
                @PathVariable Integer year,
                @PathVariable Integer month) {
        return ResponseEntity.ok(ApiResponse.success(
            budgetService.getBudgetsByMonth(month, year)));
    }

    @Operation(summary = "Get budget summary for dashboard")
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>>
            getBudgetSummary() {
        return ResponseEntity.ok(ApiResponse.success(
            budgetService.getBudgetSummary()));
    }

    @Operation(summary = "Create new budget")
    @PostMapping
    public ResponseEntity<ApiResponse<BudgetResponse>>
            createBudget(
                @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
            budgetService.createBudget(request),
            "Budget created successfully"));
    }

    @Operation(summary = "Update budget limit")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<BudgetResponse>>
            updateBudget(
                @PathVariable UUID id,
                @Valid @RequestBody BudgetRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
            budgetService.updateBudget(id, request),
            "Budget updated successfully"));
    }

    @Operation(summary = "Delete budget")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBudget(
            @PathVariable UUID id) {
        budgetService.deleteBudget(id);
        return ResponseEntity.ok(
            ApiResponse.success(null,
                "Budget deleted successfully"));
    }
}