package com.allesgut.controller;

import com.allesgut.dto.request.CreateCommentRequest;
import com.allesgut.dto.response.CommentDto;
import com.allesgut.dto.response.PageResponse;
import com.allesgut.dto.response.UserDto;
import com.allesgut.service.CommentService;
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
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class CommentsControllerTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CommentService commentService;

    @Test
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void shouldCreateCommentSuccessfully() throws Exception {
        // Given
        UUID postId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        CreateCommentRequest request = new CreateCommentRequest(
                "Test comment",
                null,
                List.of()
        );

        UserDto author = new UserDto(userId, "13800138000", "Test User",
                null, null, 0, 0, 0);
        CommentDto commentDto = new CommentDto(
                UUID.randomUUID(),
                author,
                postId,
                null,
                "Test comment",
                0,
                false,
                List.of(),
                List.of(),
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        when(commentService.createComment(any(UUID.class), any(UUID.class), any(CreateCommentRequest.class)))
                .thenReturn(commentDto);

        // When/Then
        mockMvc.perform(post("/api/posts/{postId}/comments", postId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.content").value("Test comment"))
                .andExpect(jsonPath("$.data.author.nickname").value("Test User"));
    }

    @Test
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void shouldRejectEmptyCommentContent() throws Exception {
        // Given
        UUID postId = UUID.randomUUID();
        CreateCommentRequest request = new CreateCommentRequest("", null, List.of());

        // When/Then
        mockMvc.perform(post("/api/posts/{postId}/comments", postId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    void shouldRejectUnauthenticatedRequest() throws Exception {
        // Given
        UUID postId = UUID.randomUUID();
        CreateCommentRequest request = new CreateCommentRequest("Content", null, List.of());

        // When/Then
        mockMvc.perform(post("/api/posts/{postId}/comments", postId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void shouldGetCommentsByPost() throws Exception {
        // Given
        UUID postId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();

        UserDto author = new UserDto(userId, "13800138000", "Test User",
                null, null, 0, 0, 0);
        CommentDto commentDto = new CommentDto(
                UUID.randomUUID(),
                author,
                postId,
                null,
                "Test comment",
                0,
                false,
                List.of(),
                List.of(),
                LocalDateTime.now(),
                LocalDateTime.now()
        );

        PageResponse<CommentDto> pageResponse = PageResponse.of(
                List.of(commentDto), 0, 20, 1);

        when(commentService.getCommentsByPost(any(UUID.class), any(), anyInt(), anyInt()))
                .thenReturn(pageResponse);

        // When/Then
        mockMvc.perform(get("/api/posts/{postId}/comments", postId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.data[0].content").value("Test comment"))
                .andExpect(jsonPath("$.data.total").value(1));
    }

    @Test
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void shouldDeleteCommentSuccessfully() throws Exception {
        // Given
        UUID commentId = UUID.randomUUID();
        doNothing().when(commentService).deleteComment(any(UUID.class), any(UUID.class));

        // When/Then
        mockMvc.perform(delete("/api/comments/{id}", commentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(commentService).deleteComment(eq(commentId), any(UUID.class));
    }

    @Test
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void shouldLikeCommentSuccessfully() throws Exception {
        // Given
        UUID commentId = UUID.randomUUID();
        doNothing().when(commentService).likeComment(any(UUID.class), any(UUID.class));

        // When/Then
        mockMvc.perform(post("/api/comments/{id}/like", commentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(commentService).likeComment(eq(commentId), any(UUID.class));
    }

    @Test
    @WithMockUser(username = "550e8400-e29b-41d4-a716-446655440000")
    void shouldUnlikeCommentSuccessfully() throws Exception {
        // Given
        UUID commentId = UUID.randomUUID();
        doNothing().when(commentService).unlikeComment(any(UUID.class), any(UUID.class));

        // When/Then
        mockMvc.perform(delete("/api/comments/{id}/like", commentId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        verify(commentService).unlikeComment(eq(commentId), any(UUID.class));
    }
}
