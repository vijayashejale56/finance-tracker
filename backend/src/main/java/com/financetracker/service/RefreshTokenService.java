package com.financetracker.service;

import com.financetracker.entity.RefreshToken;
import com.financetracker.entity.User;
import com.financetracker.exception.UnauthorizedException;
import com.financetracker.repository.RefreshTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenService {

    private final RefreshTokenRepository refreshTokenRepository;

    @Value("${app.jwt.refresh-token-expiry:604800000}")
    private long refreshTokenExpiry;

    // Create a new refresh token for user
    @Transactional
    public RefreshToken createRefreshToken(User user) {
        // Delete any existing tokens for this user
        // One active session per user
        refreshTokenRepository.deleteByUserId(user.getId());

        RefreshToken token = RefreshToken.builder()
            .user(user)
            .token(UUID.randomUUID().toString())
            .expiresAt(Instant.now().plusMillis(refreshTokenExpiry))
            .build();

        return refreshTokenRepository.save(token);
    }

    // Validate refresh token — throws if invalid or expired
    public RefreshToken validateRefreshToken(String token) {
        RefreshToken refreshToken = refreshTokenRepository
            .findByToken(token)
            .orElseThrow(() -> new UnauthorizedException(
                "Invalid refresh token"));

        if (refreshToken.isExpired()) {
            refreshTokenRepository.delete(refreshToken);
            throw new UnauthorizedException(
                "Refresh token expired. Please login again.");
        }

        return refreshToken;
    }

    // Delete token on logout
    @Transactional
    public void deleteByUserId(UUID userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    // Auto cleanup expired tokens every day at midnight
    @Scheduled(cron = "0 0 0 * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        refreshTokenRepository.deleteAllExpired();
        log.info("Cleaned up expired refresh tokens");
    }
}