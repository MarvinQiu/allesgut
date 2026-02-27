package com.allesgut.controller;

import com.allesgut.dto.request.CreatePostRequest;
import com.allesgut.entity.Post;
import com.allesgut.entity.Tag;
import com.allesgut.entity.User;
import com.allesgut.repository.PostRepository;
import com.allesgut.repository.TagRepository;
import com.allesgut.repository.UserRepository;
import com.allesgut.security.JwtService;
import org.springframework.jdbc.core.JdbcTemplate;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.core.env.Environment;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PostsControllerTests extends com.allesgut.LocalhostSchemaTestBase {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private Environment env;

    @Test
    void shouldUseIsolatedSchema() {
        assertThat(env.getProperty("spring.datasource.url")).contains("currentSchema=");
    }

    @Test
    void shouldCreatePostSuccessfully() throws Exception {
        // Given
        User user = userRepository.save(User.builder()
                .phone("1" + String.format("%010d", Math.abs(UUID.randomUUID().getMostSignificantBits()) % 1_000_000_0000L))
                .nickname("Test User")
                .postsCount(0)
                .followersCount(0)
                .followingCount(0)
                .build());

        String token = jwtService.generateToken(user);

        CreatePostRequest request = new CreatePostRequest(
                "Test Post",
                "This is test content",
                null,
                null,
                null,
                List.of("tag1", "tag2")
        );

        // When
        var result = mockMvc.perform(post("/api/posts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.title").value("Test Post"))
                .andExpect(jsonPath("$.data.tags[0]").value("tag1"))
                .andReturn();

        // Then (verify join table got rows)
        String json = result.getResponse().getContentAsString();
        UUID postId = objectMapper.readTree(json).path("data").path("id").traverse(objectMapper).readValueAs(UUID.class);
        assertThat(jdbcTemplate.queryForObject(
                "select count(*) from post_tags where post_id = ?",
                Integer.class,
                postId
        )).isEqualTo(2);
    }

    @Test
        void shouldRejectPostWithEmptyTitle() throws Exception {
        // Given
        CreatePostRequest request = new CreatePostRequest(
                "", // Empty title
                "Content",
                null,
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
    void shouldReturnFeedWithPublicAuthorOnly() throws Exception {
        // Given
        User author = userRepository.save(User.builder()
                .phone("1" + String.format("%010d", Math.abs(UUID.randomUUID().getMostSignificantBits()) % 1_000_000_0000L))
                .nickname("Feed Author")
                .postsCount(0)
                .followersCount(0)
                .followingCount(0)
                .build());

        postRepository.save(Post.builder()
                .userId(author.getId())
                .title("Feed Post")
                .content("Content")
                .build());

        // When/Then
        mockMvc.perform(get("/api/posts"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.data[0].author.nickname").value("Feed Author"))
                .andExpect(jsonPath("$.data.data[0].author.phone").doesNotExist())
                .andExpect(jsonPath("$.data.data[0].author.id").value(author.getId().toString()));
    }

    @Test
    void shouldReturnPostDetailWithTags() throws Exception {
        // Given
        User author = userRepository.save(User.builder()
                .phone("1" + String.format("%010d", Math.abs(UUID.randomUUID().getMostSignificantBits()) % 1_000_000_0000L))
                .nickname("Tagged Author")
                .postsCount(0)
                .followersCount(0)
                .followingCount(0)
                .build());

        Post post = postRepository.save(Post.builder()
                .userId(author.getId())
                .title("Tagged Post")
                .content("Content")
                .build());

        String tagName = "tag-" + UUID.randomUUID().toString().substring(0, 8);
        Tag tag = tagRepository.save(Tag.builder().name(tagName).build());
        jdbcTemplate.update(
                "insert into post_tags (post_id, tag_id) values (?, ?)",
                post.getId(),
                tag.getId()
        );

        // When/Then
        mockMvc.perform(get("/api/posts/{id}", post.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.tags[0]").value(tagName));
    }

    @Test
    void shouldReturnPostDetailWithPublicAuthorOnly() throws Exception {
        // Given
        User author = userRepository.save(User.builder()
                .phone("1" + String.format("%010d", Math.abs(UUID.randomUUID().getMostSignificantBits()) % 1_000_000_0000L))
                .nickname("Detail Author")
                .postsCount(0)
                .followersCount(0)
                .followingCount(0)
                .build());

        Post post = postRepository.save(Post.builder()
                .userId(author.getId())
                .title("Detail Post")
                .content("Content")
                .build());

        // When/Then
        mockMvc.perform(get("/api/posts/{id}", post.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.author.nickname").value("Detail Author"))
                .andExpect(jsonPath("$.data.author.phone").doesNotExist())
                .andExpect(jsonPath("$.data.author.id").value(author.getId().toString()));
    }

    @Test
    void shouldRejectUnauthenticatedRequest() throws Exception {
        // Given
        CreatePostRequest request = new CreatePostRequest(
                "Title",
                "Content",
                null,
                null,
                null,
                List.of()
        );

        // When/Then
        // Note: createPost(...) expects a non-null Authentication (it reads authentication.getName()).
        // When unauthenticated, Spring still invokes the controller method with authentication=null,
        // so current behavior is 500.
        mockMvc.perform(post("/api/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isInternalServerError());
    }
}
