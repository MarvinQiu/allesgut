package com.allesgut.security;

import com.allesgut.config.JwtProperties;
import com.allesgut.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTests {

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        JwtProperties jwtProperties = new JwtProperties();
        jwtProperties.setSecret("testSecretKeyThatIsLongEnoughForHS256AlgorithmRequirement");
        jwtProperties.setExpiration(3600000L); // 1 hour

        jwtService = new JwtService(jwtProperties);
    }

    @Test
    void shouldGenerateValidToken() {
        // Given
        User user = User.builder()
                .id(UUID.randomUUID())
                .phone("13800138000")
                .nickname("Test User")
                .build();

        // When
        String token = jwtService.generateToken(user);

        // Then
        assertThat(token).isNotEmpty();
    }

    @Test
    void shouldExtractUserIdFromToken() {
        // Given
        User user = User.builder()
                .id(UUID.randomUUID())
                .phone("13800138000")
                .nickname("Test User")
                .build();
        String token = jwtService.generateToken(user);

        // When
        UUID userId = jwtService.extractUserId(token);

        // Then
        assertThat(userId).isEqualTo(user.getId());
    }

    @Test
    void shouldValidateToken() {
        // Given
        User user = User.builder()
                .id(UUID.randomUUID())
                .phone("13800138000")
                .nickname("Test User")
                .build();
        String token = jwtService.generateToken(user);

        // When
        boolean isValid = jwtService.validateToken(token);

        // Then
        assertThat(isValid).isTrue();
    }

    @Test
    void shouldReturnFalseForInvalidToken() {
        // When
        boolean isValid = jwtService.validateToken("invalid.token.here");

        // Then
        assertThat(isValid).isFalse();
    }
}
