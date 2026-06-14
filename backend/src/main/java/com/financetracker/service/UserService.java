package com.financetracker.service;

import com.financetracker.dto.request.UpdateProfileRequest;
import com.financetracker.dto.response.UserResponse;
import com.financetracker.entity.User;
import com.financetracker.repository.AccountRepository;
import com.financetracker.repository.TransactionRepository;
import com.financetracker.repository.UserRepository;
import com.financetracker.exception.BadRequestException;

import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;

    // Get current logged in user
    private User getCurrentUser() {
        String email = SecurityContextHolder
            .getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));
    }

    // Convert User entity to UserResponse DTO
    private UserResponse toResponse(User user) {
        return new UserResponse(
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.getCurrency()
        );
    }

    // GET current user profile
    public UserResponse getProfile() {
        return toResponse(getCurrentUser());
    }

    // PUT update name and currency
    public UserResponse updateProfile(UpdateProfileRequest request) {
        User user = getCurrentUser();
        user.setFullName(request.fullName());
        if (request.currency() != null && !request.currency().isBlank()) {
            user.setCurrency(request.currency());
        }
        return toResponse(userRepository.save(user));
    }

    // // PUT change password
    // public void changePassword(String currentPassword, String newPassword) {
    //     User user = getCurrentUser();

    //     // Verify current password is correct
    //     if (!passwordEncoder.matches(currentPassword, user.getPasswordHash())) {
    //         throw new RuntimeException("Current password is incorrect");
    //     }

    //     // Validate new password length
    //     if (newPassword.length() < 8) {
    //         throw new RuntimeException(
    //             "New password must be at least 8 characters");
    //     }

    //     user.setPasswordHash(passwordEncoder.encode(newPassword));
    //     userRepository.save(user);
    // }


    public void changePassword(String currentPassword, String newPassword) {
    User user = getCurrentUser();
    if (!passwordEncoder.matches(
            currentPassword, user.getPasswordHash())) {
        throw new BadRequestException(
            "Current password is incorrect",
            "INVALID_CURRENT_PASSWORD");
    }
    if (newPassword.length() < 8) {
        throw new BadRequestException(
            "New password must be at least 8 characters",
            "PASSWORD_TOO_SHORT");
    }
    user.setPasswordHash(passwordEncoder.encode(newPassword));
    userRepository.save(user);
}

    // GET user stats for profile page
    public java.util.Map<String, Object> getUserStats() {
        User user = getCurrentUser();
        long accountCount = accountRepository
            .findByUserIdAndIsActiveTrue(user.getId()).size();

        java.util.Map<String, Object> stats = new java.util.LinkedHashMap<>();
        stats.put("totalAccounts", accountCount);
        stats.put("memberSince", user.getCreatedAt());
        return stats;
    }
}