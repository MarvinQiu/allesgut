package com.allesgut.controller;

import com.allesgut.dto.request.CreatePostRequest;
import com.allesgut.dto.response.PostDto;
import com.allesgut.dto.response.UserDto;
import com.allesgut.service.PostService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PostsControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PostService postService;

    @Test
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void shouldCreatePostSuccessfully() throws Exception {
        // Given
        UUID userId = UUID.fromString("550e8400-e29b-41d4-a716-446655440000");
        CreatePostRequest request = new CreatePostRequest(
                "Test Post",
                "This is test content",
                null,
                null,
                List.of("tag1", "tag2")
        );

        UserDto author = new UserDto(userId, "138****8000", "Test User",
                null, null, 1, 0, 0);
        PostDto postDto = new PostDto(
                UUID.randomUUID(),
                author,
                "Test Post",
                "This is test content",
                null,
                null,
                List.of("tag1", "tag2"),
                0, 0, 0,
                false, false,
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        when(postService.createPost(any(UUID.class), any(CreatePostRequest.class)))
                .thenReturn(postDto);

        // When/Then
        mockMvc.perform(post("/api/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Test Post"))
                .andExpect(jsonPath("$.data.tags[0]").value("tag1"));
    }

    @Test
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void shouldRejectPostWithEmptyTitle() throws Exception {
        // Given
        CreatePostRequest request = new CreatePostRequest(
                "", // Empty title
                "Content",
                null,
                null,
                List.of()
        );

        // When/Then
        mockMvc.perform(post("/api/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectUnauthenticatedRequest() throws Exception {
        // Given
        CreatePostRequest request = new CreatePostRequest(
                "Title",
                "Content",
                null,
                null,
                List.of()
        );

        // When/Then - Spring Security returns 403 for unauthenticated requests to protected endpoints
        mockMvc.perform(post("/api/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }
}
