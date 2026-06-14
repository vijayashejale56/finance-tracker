package com.financetracker.controller;

import com.financetracker.dto.request.LoginRequest;
import com.financetracker.dto.request.RefreshTokenRequest;
import com.financetracker.dto.request.RegisterRequest;
import com.financetracker.dto.response.ApiResponse;
import com.financetracker.dto.response.AuthResponse;
import com.financetracker.dto.response.RefreshTokenResponse;
import com.financetracker.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.financetracker.service.EmailService;


import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import io.swagger.v3.oas.annotations.responses.ApiResponses;

// @RestController
// @RequestMapping("/api/v1/auth")
// @RequiredArgsConstructor
@Tag(name = "Authentication",
     description = "Register, login, refresh token, logout")
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final EmailService emailService;

    // @PostMapping("/register")
    // public ResponseEntity<ApiResponse<AuthResponse>> register(
    //         @Valid @RequestBody RegisterRequest request) {
    //     return ResponseEntity.ok(
    //         ApiResponse.success(
    //             authService.register(request),
    //             "Registration successful"));
    // }

    @Operation(summary = "Register new user",
               description = "Creates a new user account")
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<AuthResponse>> register(
            @Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(
            ApiResponse.success(
                authService.register(request),
                "Registration successful"));
    }

    @Operation(summary = "Login",
               description = "Authenticate and get access + refresh tokens")
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(
            @Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(
            ApiResponse.success(
                authService.login(request),
                "Login successful"));
    }

    // @PostMapping("/login")
    // public ResponseEntity<ApiResponse<AuthResponse>> login(
    //         @Valid @RequestBody LoginRequest request) {
    //     return ResponseEntity.ok(
    //         ApiResponse.success(
    //             authService.login(request),
    //             "Login successful"));
    // }

    // @PostMapping("/refresh")
    // public ResponseEntity<ApiResponse<RefreshTokenResponse>> refresh(
    //         @Valid @RequestBody RefreshTokenRequest request) {
    //     return ResponseEntity.ok(
    //         ApiResponse.success(
    //             authService.refresh(request.refreshToken()),
    //             "Token refreshed"));
    // }

    @Operation(summary = "Refresh access token",
               description = "Get new access token using refresh token")
    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<RefreshTokenResponse>> refresh(
            @Valid @RequestBody RefreshTokenRequest request) {
        return ResponseEntity.ok(
            ApiResponse.success(
                authService.refresh(request.refreshToken()),
                "Token refreshed"));
    }


     @Operation(summary = "Logout",
               description = "Invalidate refresh token")
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse<Void>> logout(
            @RequestBody RefreshTokenRequest request) {
        authService.logout(request.refreshToken());
        return ResponseEntity.ok(
            ApiResponse.success(null, "Logged out successfully"));
    }

    @GetMapping("/test-email")
public ResponseEntity<String> testEmail() {
    emailService.sendWelcomeEmail(
        "vijayashejale1999@gmail.com",
        "Test User");
    return ResponseEntity.ok("Email sent!");
}
}

