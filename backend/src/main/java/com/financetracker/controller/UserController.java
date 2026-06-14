package com.financetracker.controller;

import com.financetracker.dto.request.UpdateProfileRequest;
import com.financetracker.dto.response.UserResponse;
import com.financetracker.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

import java.util.Map;

@Tag(name = "Users", description = "User profile management")
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    // GET current user profile
     @Operation(summary = "Get current user profile")
    @GetMapping("/me")
    public ResponseEntity<UserResponse> getProfile() {
        return ResponseEntity.ok(userService.getProfile());
    }

    // PUT update profile
    @Operation(summary = "Update profile",
               description = "Update name and currency preference")
    @PutMapping("/me")
    public ResponseEntity<UserResponse> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(userService.updateProfile(request));
    }

    // PUT change password
    @Operation(summary = "Change password")
    @PutMapping("/me/password")
    public ResponseEntity<Map<String, String>> changePassword(
            @RequestBody Map<String, String> request) {
        userService.changePassword(
            request.get("currentPassword"),
            request.get("newPassword")
        );
        return ResponseEntity.ok(
            Map.of("message", "Password changed successfully"));
    }

    // GET user stats
    @Operation(summary = "Get user statistics")
    @GetMapping("/me/stats")
    public ResponseEntity<Map<String, Object>> getUserStats() {
        return ResponseEntity.ok(userService.getUserStats());
    }

}