package com.financetracker.service;

import com.financetracker.dto.request.LoginRequest;
import com.financetracker.dto.request.RegisterRequest;
import com.financetracker.dto.response.AuthResponse;
import com.financetracker.entity.RefreshToken;
import com.financetracker.entity.User;
import com.financetracker.exception.BadRequestException;
import com.financetracker.helper.TestDataFactory;
import com.financetracker.repository.UserRepository;
import com.financetracker.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import static org.junit.jupiter.api.Assertions.*;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService Tests")
class AuthServiceTest {

    // Mocks — fake versions of dependencies
    @Mock private UserRepository userRepository;
    @Mock private PasswordEncoder passwordEncoder;
    @Mock private JwtUtil jwtUtil;
    @Mock private AuthenticationManager authenticationManager;
    @Mock private RefreshTokenService refreshTokenService;
    @Mock private EmailService emailService;

    // The real class we are testing
    @InjectMocks private AuthService authService;

    private User testUser;
    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        testUser = TestDataFactory.createUser();
        registerRequest = TestDataFactory.createRegisterRequest();
        loginRequest = TestDataFactory.createLoginRequest();
    }

    // ─── Register Tests ───────────────────────────────
    @Nested
    @DisplayName("register()")
    class RegisterTests {

        @Test
        @DisplayName("Should register successfully when email is new")
        void register_WithNewEmail_ReturnsAuthResponse() {
            // ARRANGE
            when(userRepository.existsByEmail(registerRequest.email()))
                .thenReturn(false);
            when(passwordEncoder.encode(registerRequest.password()))
                .thenReturn("$2a$10$hashedPassword");
            when(userRepository.save(any(User.class)))
                .thenReturn(testUser);
            when(jwtUtil.generateToken(anyString()))
                .thenReturn("mock.jwt.token");

            RefreshToken mockRefreshToken = RefreshToken.builder()
                .token(UUID.randomUUID().toString())
                .user(testUser)
                .expiresAt(Instant.now().plusSeconds(604800))
                .build();
            when(refreshTokenService.createRefreshToken(any(User.class)))
                .thenReturn(mockRefreshToken);

            // ACT
            AuthResponse response = authService.register(registerRequest);

            // ASSERT
            assertThat(response).isNotNull();
            assertThat(response.accessToken()).isEqualTo("mock.jwt.token");
            assertThat(response.email()).isEqualTo(testUser.getEmail());
            assertThat(response.fullName()).isEqualTo(testUser.getFullName());

            // Verify save was called once
            verify(userRepository, times(1)).save(any(User.class));
            // Verify password was hashed
            verify(passwordEncoder, times(1))
                .encode(registerRequest.password());
        }

        @Test
        @DisplayName("Should throw BadRequestException when email already exists")
        void register_WithExistingEmail_ThrowsBadRequestException() {
            // ARRANGE
            when(userRepository.existsByEmail(registerRequest.email()))
                .thenReturn(true);

            // ACT + ASSERT
            BadRequestException exception = assertThrows(
                BadRequestException.class,
                () -> authService.register(registerRequest)
            );

            assertThat(exception.getMessage())
                .isEqualTo("Email already registered");
            assertThat(exception.getCode())
                .isEqualTo("EMAIL_ALREADY_EXISTS");

            // Verify save was NEVER called
            verify(userRepository, never()).save(any());
        }

        @Test
        @DisplayName("Should hash password before saving")
        void register_ShouldHashPassword_NotStoreRawPassword() {
            // ARRANGE
            when(userRepository.existsByEmail(any())).thenReturn(false);
            when(passwordEncoder.encode("password123"))
                .thenReturn("$2a$10$hashedPassword");
            when(userRepository.save(any())).thenReturn(testUser);
            when(jwtUtil.generateToken(any())).thenReturn("token");
            when(refreshTokenService.createRefreshToken(any()))
                .thenReturn(RefreshToken.builder()
                    .token("refresh-token")
                    .expiresAt(Instant.now().plusSeconds(3600))
                    .user(testUser)
                    .build());

            // ACT
            authService.register(registerRequest);

            // ASSERT — password encoder was called with raw password
            verify(passwordEncoder).encode("password123");

            // Verify saved user has hashed password not raw
            verify(userRepository).save(argThat(user ->
                !user.getPasswordHash().equals("password123")
            ));
        }
    }

    // ─── Login Tests ──────────────────────────────────
    @Nested
    @DisplayName("login()")
    class LoginTests {

        @Test
        @DisplayName("Should login successfully with correct credentials")
        void login_WithCorrectCredentials_ReturnsAuthResponse() {
            // ARRANGE
            when(userRepository.findByEmail(loginRequest.email()))
                .thenReturn(Optional.of(testUser));
            when(jwtUtil.generateToken(testUser.getEmail()))
                .thenReturn("mock.jwt.token");
            when(refreshTokenService.createRefreshToken(testUser))
                .thenReturn(RefreshToken.builder()
                    .token("refresh-token-uuid")
                    .expiresAt(Instant.now().plusSeconds(604800))
                    .user(testUser)
                    .build());

            // ACT
            AuthResponse response = authService.login(loginRequest);

            // ASSERT
            assertThat(response.accessToken()).isEqualTo("mock.jwt.token");
            assertThat(response.refreshToken()).isEqualTo("refresh-token-uuid");
            assertThat(response.email()).isEqualTo(testUser.getEmail());
        }

        @Test
        @DisplayName("Should throw BadCredentialsException for wrong password")
        void login_WithWrongPassword_ThrowsBadCredentialsException() {
            // ARRANGE — authentication manager throws exception
            doThrow(new BadCredentialsException("Bad credentials"))
                .when(authenticationManager)
                .authenticate(any(UsernamePasswordAuthenticationToken.class));

            // ACT + ASSERT
            assertThrows(
                BadCredentialsException.class,
                () -> authService.login(loginRequest)
            );

            // Verify token was never generated
            verify(jwtUtil, never()).generateToken(any());
        }
    }
}