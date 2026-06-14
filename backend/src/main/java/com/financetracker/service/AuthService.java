package com.financetracker.service;

import com.financetracker.dto.request.LoginRequest;
import com.financetracker.dto.request.RegisterRequest;
import com.financetracker.dto.response.AuthResponse;
import com.financetracker.dto.response.RefreshTokenResponse;
import com.financetracker.entity.RefreshToken;
import com.financetracker.entity.User;
import com.financetracker.exception.BadRequestException;
import com.financetracker.repository.UserRepository;
import com.financetracker.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;
    private final RefreshTokenService refreshTokenService;
    private final EmailService emailService;

    @Transactional
        public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new BadRequestException(
                "Email already registered",
                "EMAIL_ALREADY_EXISTS");
        }

        User user = User.builder()
            .email(request.email())
            .passwordHash(passwordEncoder.encode(
                request.password()))
            .fullName(request.fullName())
            .build();

        userRepository.save(user);

        // Send welcome email asynchronously
        // ← Add these lines
        emailService.sendWelcomeEmail(
            user.getEmail(), user.getFullName());

        String accessToken =
            jwtUtil.generateToken(user.getEmail());
        RefreshToken refreshToken =
            refreshTokenService.createRefreshToken(user);

        log.info("New user registered: {}", user.getEmail());

        return new AuthResponse(
            accessToken, refreshToken.getToken(),
            user.getEmail(), user.getFullName());
    }
    // public AuthResponse register(RegisterRequest request) {
    //     if (userRepository.existsByEmail(request.email())) {
    //         throw new BadRequestException(
    //             "Email already registered", "EMAIL_ALREADY_EXISTS");
    //     }

    //     User user = User.builder()
    //         .email(request.email())
    //         .passwordHash(passwordEncoder.encode(request.password()))
    //         .fullName(request.fullName())
    //         .build();

    //     userRepository.save(user);

    //     // Generate both tokens
    //     String accessToken = jwtUtil.generateToken(user.getEmail());
    //     RefreshToken refreshToken =
    //         refreshTokenService.createRefreshToken(user);

    //     log.info("New user registered: {}", user.getEmail());

    //     return new AuthResponse(
    //         accessToken,
    //         refreshToken.getToken(),
    //         user.getEmail(),
    //         user.getFullName()
    //     );
    // }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.email(), request.password())
        );

        User user = userRepository.findByEmail(request.email())
            .orElseThrow();

        // Generate both tokens
        String accessToken = jwtUtil.generateToken(user.getEmail());
        RefreshToken refreshToken =
            refreshTokenService.createRefreshToken(user);

        log.info("User logged in: {}", user.getEmail());

        return new AuthResponse(
            accessToken,
            refreshToken.getToken(),
            user.getEmail(),
            user.getFullName()
        );
    }

    // Refresh access token using refresh token
    @Transactional
    public RefreshTokenResponse refresh(String refreshToken) {
        RefreshToken token =
            refreshTokenService.validateRefreshToken(refreshToken);

        // Generate new access token
        String newAccessToken =
            jwtUtil.generateToken(token.getUser().getEmail());

        // Rotate refresh token — issue new one for security
        RefreshToken newRefreshToken =
            refreshTokenService.createRefreshToken(token.getUser());

        return new RefreshTokenResponse(
            newAccessToken,
            newRefreshToken.getToken()
        );
    }

    // Logout — invalidate refresh token
    @Transactional
    public void logout(String refreshToken) {
        refreshTokenService.validateRefreshToken(refreshToken);
        RefreshToken token =
            refreshTokenService.validateRefreshToken(refreshToken);
        refreshTokenService.deleteByUserId(
            token.getUser().getId());
        log.info("User logged out");
    }
}

