package com.allesgut.service;

import com.allesgut.dto.response.UserDto;
import com.allesgut.entity.User;
import com.allesgut.repository.UserFollowRepository;
import com.allesgut.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTests {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserFollowRepository userFollowRepository;

    @InjectMocks
    private UserService userService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .phone("13800138000")
                .nickname("Test User")
                .avatarUrl("https://example.com/avatar.jpg")
                .bio("Test bio")
                .postsCount(10)
                .followersCount(5)
                .followingCount(3)
                .build();
    }

    @Test
    void shouldGetUserProfileSuccessfully() {
        // Given
        UUID userId = testUser.getId();
        UUID currentUserId = UUID.randomUUID();

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        // When
        UserDto result = userService.getUserProfile(userId, currentUserId);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.id()).isEqualTo(userId);
        assertThat(result.nickname()).isEqualTo("Test User");
        assertThat(result.postsCount()).isEqualTo(10);
        assertThat(result.followersCount()).isEqualTo(5);
        assertThat(result.followingCount()).isEqualTo(3);
    }

    @Test
    void shouldReturnProfileWithoutFollowStatus() {
        // Given
        UUID userId = testUser.getId();
        UUID currentUserId = UUID.randomUUID();

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        // When
        UserDto result = userService.getUserProfile(userId, currentUserId);

        // Then
        assertThat(result).isNotNull();
    }

    @Test
    void shouldGetProfileWithoutCurrentUser() {
        // Given
        UUID userId = testUser.getId();

        when(userRepository.findById(userId)).thenReturn(Optional.of(testUser));

        // When
        UserDto result = userService.getUserProfile(userId, null);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.nickname()).isEqualTo("Test User");
    }

    @Test
    void shouldThrowExceptionWhenUserNotFound() {
        // Given
        UUID userId = UUID.randomUUID();
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> userService.getUserProfile(userId, null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("User not found");
    }
}
