package com.financetracker.controller;

import com.financetracker.dto.request.ContributeRequest;
import com.financetracker.dto.request.GoalRequest;
import com.financetracker.dto.response.ApiResponse;
import com.financetracker.dto.response.GoalResponse;
import com.financetracker.service.GoalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Tag(name = "Goals",
     description = "Set and track financial goals")
@RestController
@RequestMapping("/api/v1/goals")
@RequiredArgsConstructor
public class GoalController {

    private final GoalService goalService;

    @Operation(summary = "Get all goals")
    @GetMapping
    public ResponseEntity<ApiResponse<List<GoalResponse>>>
            getAllGoals() {
        return ResponseEntity.ok(
            ApiResponse.success(goalService.getAllGoals()));
    }

    @Operation(summary = "Get goals summary")
    @GetMapping("/summary")
    public ResponseEntity<ApiResponse<Map<String, Object>>>
            getGoalSummary() {
        return ResponseEntity.ok(
            ApiResponse.success(
                goalService.getGoalSummary()));
    }

    @Operation(summary = "Create new goal")
    @PostMapping
    public ResponseEntity<ApiResponse<GoalResponse>>
            createGoal(
                @Valid @RequestBody GoalRequest request) {
        return ResponseEntity.ok(
            ApiResponse.success(
                goalService.createGoal(request),
                "Goal created successfully"));
    }

    @Operation(summary = "Update goal")
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<GoalResponse>>
            updateGoal(
                @PathVariable UUID id,
                @Valid @RequestBody GoalRequest request) {
        return ResponseEntity.ok(
            ApiResponse.success(
                goalService.updateGoal(id, request),
                "Goal updated"));
    }

    @Operation(summary = "Contribute to goal",
               description = "Add money towards goal manually")
    @PutMapping("/{id}/contribute")
    public ResponseEntity<ApiResponse<GoalResponse>>
            contribute(
                @PathVariable UUID id,
                @Valid @RequestBody
                ContributeRequest request) {
        return ResponseEntity.ok(
            ApiResponse.success(
                goalService.contribute(id, request),
                "Contribution added!"));
    }

    @Operation(summary = "Delete goal")
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteGoal(
            @PathVariable UUID id) {
        goalService.deleteGoal(id);
        return ResponseEntity.ok(
            ApiResponse.success(null,
                "Goal deleted"));
    }
}