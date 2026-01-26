package com.allesgut.integration;

import com.allesgut.dto.request.CreateCommentRequest;
import com.allesgut.dto.response.CommentDto;
import com.allesgut.entity.Post;
import com.allesgut.entity.User;
import com.allesgut.repository.CommentRepository;
import com.allesgut.repository.PostRepository;
import com.allesgut.repository.UserRepository;
import com.allesgut.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CommentLikeIntegrationTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private JwtService jwtService;

    private String authToken;
    private User testUser;
    private Post testPost;

    @BeforeEach
    void setUp() {
        // Clean up
        commentRepository.deleteAll();
        postRepository.deleteAll();
        userRepository.deleteAll();

        // Create test user
        testUser = User.builder()
                .phone("13800138000")
                .nickname("Test User")
                .build();
        testUser = userRepository.save(testUser);

        // Generate auth token
        authToken = jwtService.generateToken(testUser);

        // Create test post
        testPost = Post.builder()
                .userId(testUser.getId())
                .title("Test Post")
                .content("Content")
                .commentsCount(0)
                .build();
        testPost = postRepository.save(testPost);
    }

    @Test
    void shouldLikeAndUnlikeComment() throws Exception {
        // Create comment
        CreateCommentRequest createRequest = new CreateCommentRequest(
                "Test comment", null, List.of());

        MvcResult createResult = mockMvc.perform(post("/api/posts/{postId}/comments", testPost.getId())
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String responseJson = createResult.getResponse().getContentAsString();
        CommentDto createdComment = objectMapper.readTree(responseJson)
                .get("data")
                .traverse(objectMapper)
                .readValueAs(CommentDto.class);

        UUID commentId = createdComment.id();

        // Like comment
        mockMvc.perform(post("/api/comments/{id}/like", commentId)
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Verify like count increased
        mockMvc.perform(get("/api/posts/{postId}/comments", testPost.getId())
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.data[0].likesCount").value(1))
                .andExpect(jsonPath("$.data.data[0].isLiked").value(true));

        // Unlike comment
        mockMvc.perform(delete("/api/comments/{id}/like", commentId)
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        // Verify like count decreased
        mockMvc.perform(get("/api/posts/{postId}/comments", testPost.getId())
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.data[0].likesCount").value(0))
                .andExpect(jsonPath("$.data.data[0].isLiked").value(false));
    }

    @Test
    void shouldNotLikeSameCommentTwice() throws Exception {
        // Create comment
        CreateCommentRequest createRequest = new CreateCommentRequest(
                "Test comment", null, List.of());

        MvcResult createResult = mockMvc.perform(post("/api/posts/{postId}/comments", testPost.getId())
                        .header("Authorization", "Bearer " + authToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(createRequest)))
                .andExpect(status().isCreated())
                .andReturn();

        String responseJson = createResult.getResponse().getContentAsString();
        CommentDto createdComment = objectMapper.readTree(responseJson)
                .get("data")
                .traverse(objectMapper)
                .readValueAs(CommentDto.class);

        UUID commentId = createdComment.id();

        // Like comment first time
        mockMvc.perform(post("/api/comments/{id}/like", commentId)
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isOk());

        // Try to like again - should fail
        mockMvc.perform(post("/api/comments/{id}/like", commentId)
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Comment already liked"));
    }
}
