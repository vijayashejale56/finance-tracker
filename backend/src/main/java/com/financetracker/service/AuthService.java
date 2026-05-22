package com.financetracker.service;

import com.financetracker.dto.request.LoginRequest;
import com.financetracker.dto.request.RegisterRequest;
import com.financetracker.dto.response.AuthResponse;
import com.financetracker.entity.User;
import com.financetracker.repository.UserRepository;
import com.financetracker.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new RuntimeException("Email already registered");
        }

        var user = User.builder()
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .fullName(request.fullName())
                .build();

        userRepository.save(user);
        String token = jwtUtil.generateToken(user.getEmail());
        return new AuthResponse(token, user.getEmail(), user.getFullName());
    }

    // public AuthResponse login(LoginRequest request) {
    //     authenticationManager.authenticate(
    //         new UsernamePasswordAuthenticationToken(request.email(), request.password())
    //     );
    //     var user = userRepository.findByEmail(request.email()).orElseThrow();
    //     String token = jwtUtil.generateToken(user.getEmail());
    //     return new AuthResponse(token, user.getEmail(), user.getFullName());
    // }

    public AuthResponse login(LoginRequest request) {
    System.out.println("=== LOGIN ATTEMPT ===");
    System.out.println("Email: " + request.email());
    System.out.println("Password length: " + request.password().length());

    // Find user manually to check
    var userOpt = userRepository.findByEmail(request.email());
    if (userOpt.isEmpty()) {
        System.out.println("USER NOT FOUND");
    } else {
        var user = userOpt.get();
        System.out.println("User found: " + user.getEmail());
        System.out.println("Hash in DB: " + user.getPasswordHash());
        boolean matches = passwordEncoder.matches(
            request.password(), user.getPasswordHash());
        System.out.println("Password matches: " + matches);
    }

    try {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(
                request.email(), request.password())
        );
        var user = userRepository.findByEmail(request.email()).orElseThrow();
        String token = jwtUtil.generateToken(user.getEmail());
        System.out.println("LOGIN SUCCESS");
        return new AuthResponse(token, user.getEmail(), user.getFullName());
    } catch (Exception e) {
        System.out.println("AUTH FAILED: " + e.getMessage());
        throw e;
    }
}
}