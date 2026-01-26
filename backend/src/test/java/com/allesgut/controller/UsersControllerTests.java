package com.allesgut.controller;

import com.allesgut.dto.response.UserDto;
import com.allesgut.service.UserService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UsersControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @Test
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void shouldGetUserProfileSuccessfully() throws Exception {
        // Given
        UUID userId = UUID.randomUUID();
        UserDto userDto = new UserDto(
                userId,
                "13800138000",
                "Test User",
                "https://example.com/avatar.jpg",
                "Test bio",
                10,
                5,
                3
        );

        when(userService.getUserProfile(any(UUID.class), any()))
                .thenReturn(userDto);

        // When/Then
        mockMvc.perform(get("/api/users/{id}", userId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.id").value(userId.toString()))
                .andExpect(jsonPath("$.data.nickname").value("Test User"))
                .andExpect(jsonPath("$.data.postsCount").value(10))
                .andExpect(jsonPath("$.data.followersCount").value(5))
                .andExpect(jsonPath("$.data.followingCount").value(3));
    }

    @Test
    void shouldAllowUnauthenticatedUserToViewProfile() throws Exception {
        // Given
        UUID userId = UUID.randomUUID();
        UserDto userDto = new UserDto(
                userId,
                "13800138000",
                "Test User",
                null,
                null,
                10,
                5,
                3
        );

        when(userService.getUserProfile(any(UUID.class), any()))
                .thenReturn(userDto);

        // When/Then
        mockMvc.perform(get("/api/users/{id}", userId))
                .andExpect(status().isOk());
    }

    @Test
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void shouldReturn404WhenUserNotFound() throws Exception {
        // Given
        UUID userId = UUID.randomUUID();
        when(userService.getUserProfile(any(UUID.class), any()))
                .thenThrow(new IllegalArgumentException("User not found"));

        // When/Then
        mockMvc.perform(get("/api/users/{id}", userId))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false));
    }
}
