package com.financetracker.integration;

import com.financetracker.BaseIntegrationTest;
import com.financetracker.dto.request.LoginRequest;
import com.financetracker.dto.request.RegisterRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("Auth Controller Integration Tests")
class AuthControllerIntegrationTest extends BaseIntegrationTest {

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    @DisplayName("POST /auth/register — should register successfully")
    void register_WithValidData_Returns200() {
        RegisterRequest request = new RegisterRequest(
            "newuser@example.com",
            "password123",
            "New User"
        );

        ResponseEntity<Map> response = restTemplate.postForEntity(
            "/api/v1/auth/register", request, Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).containsKey("success");
        assertThat(response.getBody().get("success")).isEqualTo(true);

        Map data = (Map) response.getBody().get("data");
        assertThat(data).containsKey("accessToken");
        assertThat(data).containsKey("refreshToken");
        assertThat(data.get("email")).isEqualTo("newuser@example.com");
    }

    @Test
    @DisplayName("POST /auth/register — should fail with duplicate email")
    void register_WithExistingEmail_Returns400() {
        RegisterRequest request = new RegisterRequest(
            "duplicate2@example.com",
            "password123",
            "First User"
        );

        // Register first time
        restTemplate.postForEntity(
            "/api/v1/auth/register", request, Map.class);

        // Register again — should fail
        ResponseEntity<Map> response = restTemplate.postForEntity(
            "/api/v1/auth/register", request, Map.class);

        assertThat(response.getStatusCode())
            .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().get("code"))
            .isEqualTo("EMAIL_ALREADY_EXISTS");
    }

    @Test
    @DisplayName("POST /auth/register — should fail with invalid email")
    void register_WithInvalidEmail_Returns400() {
        RegisterRequest request = new RegisterRequest(
            "not-an-email",
            "password123",
            "Test User"
        );

        ResponseEntity<Map> response = restTemplate.postForEntity(
            "/api/v1/auth/register", request, Map.class);

        assertThat(response.getStatusCode())
            .isEqualTo(HttpStatus.BAD_REQUEST);
        assertThat(response.getBody().get("code"))
            .isEqualTo("VALIDATION_FAILED");
    }

    @Test
    @DisplayName("POST /auth/login — should login successfully")
    void login_WithCorrectCredentials_Returns200() {
        // First register
        RegisterRequest registerRequest = new RegisterRequest(
            "logintest2@example.com",
            "password123",
            "Login Test"
        );
        restTemplate.postForEntity(
            "/api/v1/auth/register", registerRequest, Map.class);

        // Then login
        LoginRequest loginRequest = new LoginRequest(
            "logintest2@example.com",
            "password123"
        );
        ResponseEntity<Map> response = restTemplate.postForEntity(
            "/api/v1/auth/login", loginRequest, Map.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        Map data = (Map) response.getBody().get("data");
        assertThat(data).containsKey("accessToken");
        assertThat(data).containsKey("refreshToken");
    }

    @Test
    @DisplayName("POST /auth/login — should fail with wrong password")
    void login_WithWrongPassword_Returns401() {
        LoginRequest request = new LoginRequest(
            "nonexistent@example.com",
            "wrongpassword"
        );

        ResponseEntity<Map> response = restTemplate.postForEntity(
            "/api/v1/auth/login", request, Map.class);

        assertThat(response.getStatusCode())
            .isEqualTo(HttpStatus.UNAUTHORIZED);
        assertThat(response.getBody().get("code"))
            .isEqualTo("INVALID_CREDENTIALS");
    }
}

// package com.financetracker.integration;

// import com.fasterxml.jackson.databind.ObjectMapper;
// import com.financetracker.BaseIntegrationTest;
// import com.financetracker.dto.request.LoginRequest;
// import com.financetracker.dto.request.RegisterRequest;
// import org.junit.jupiter.api.DisplayName;
// import org.junit.jupiter.api.Test;
// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
// import org.springframework.http.MediaType;
// import org.springframework.test.web.servlet.MockMvc;
// import org.springframework.transaction.annotation.Transactional;

// import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
// import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

// @AutoConfigureMockMvc
// @Transactional
// @DisplayName("Auth Controller Integration Tests")
// class AuthControllerIntegrationTest extends BaseIntegrationTest {

//     @Autowired private MockMvc mockMvc;
//     @Autowired private ObjectMapper objectMapper;

//     @Test
//     @DisplayName("POST /auth/register — should register successfully")
//     void register_WithValidData_Returns200() throws Exception {
//         RegisterRequest request = new RegisterRequest(
//             "newuser@example.com",
//             "password123",
//             "New User"
//         );

//         mockMvc.perform(post("/api/v1/auth/register")
//                 .contentType(MediaType.APPLICATION_JSON)
//                 .content(objectMapper.writeValueAsString(request)))
//             .andExpect(status().isOk())
//             .andExpect(jsonPath("$.success").value(true))
//             .andExpect(jsonPath("$.data.accessToken").exists())
//             .andExpect(jsonPath("$.data.refreshToken").exists())
//             .andExpect(jsonPath("$.data.email")
//                 .value("newuser@example.com"));
//     }

//     @Test
//     @DisplayName("POST /auth/register — should fail with duplicate email")
//     void register_WithExistingEmail_Returns400() throws Exception {
//         RegisterRequest request = new RegisterRequest(
//             "duplicate@example.com",
//             "password123",
//             "First User"
//         );

//         // Register first time — should succeed
//         mockMvc.perform(post("/api/v1/auth/register")
//                 .contentType(MediaType.APPLICATION_JSON)
//                 .content(objectMapper.writeValueAsString(request)))
//             .andExpect(status().isOk());

//         // Register again — should fail
//         mockMvc.perform(post("/api/v1/auth/register")
//                 .contentType(MediaType.APPLICATION_JSON)
//                 .content(objectMapper.writeValueAsString(request)))
//             .andExpect(status().isBadRequest())
//             .andExpect(jsonPath("$.code")
//                 .value("EMAIL_ALREADY_EXISTS"));
//     }

//     @Test
//     @DisplayName("POST /auth/register — should fail with invalid email format")
//     void register_WithInvalidEmail_Returns400() throws Exception {
//         RegisterRequest request = new RegisterRequest(
//             "not-an-email",
//             "password123",
//             "Test User"
//         );

//         mockMvc.perform(post("/api/v1/auth/register")
//                 .contentType(MediaType.APPLICATION_JSON)
//                 .content(objectMapper.writeValueAsString(request)))
//             .andExpect(status().isBadRequest())
//             .andExpect(jsonPath("$.code")
//                 .value("VALIDATION_FAILED"));
//     }

//     @Test
//     @DisplayName("POST /auth/login — should login successfully")
//     void login_WithCorrectCredentials_Returns200() throws Exception {
//         // First register the user
//         RegisterRequest registerRequest = new RegisterRequest(
//             "logintest@example.com",
//             "password123",
//             "Login Test"
//         );
//         mockMvc.perform(post("/api/v1/auth/register")
//                 .contentType(MediaType.APPLICATION_JSON)
//                 .content(objectMapper.writeValueAsString(registerRequest)))
//             .andExpect(status().isOk());

//         // Then login
//         LoginRequest loginRequest = new LoginRequest(
//             "logintest@example.com",
//             "password123"
//         );
//         mockMvc.perform(post("/api/v1/auth/login")
//                 .contentType(MediaType.APPLICATION_JSON)
//                 .content(objectMapper.writeValueAsString(loginRequest)))
//             .andExpect(status().isOk())
//             .andExpect(jsonPath("$.success").value(true))
//             .andExpect(jsonPath("$.data.accessToken").exists())
//             .andExpect(jsonPath("$.data.refreshToken").exists());
//     }

//     @Test
//     @DisplayName("POST /auth/login — should fail with wrong password")
//     void login_WithWrongPassword_Returns401() throws Exception {
//         LoginRequest request = new LoginRequest(
//             "test@example.com",
//             "wrongpassword"
//         );

//         mockMvc.perform(post("/api/v1/auth/login")
//                 .contentType(MediaType.APPLICATION_JSON)
//                 .content(objectMapper.writeValueAsString(request)))
//             .andExpect(status().isUnauthorized())
//             .andExpect(jsonPath("$.code")
//                 .value("INVALID_CREDENTIALS"));
//     }
// }