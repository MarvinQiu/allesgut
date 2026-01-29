# AllesGut Backend Implementation Plan - Complete Version (Tasks 1-50)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a complete Spring Boot backend for AllesGut, a special needs children parent community platform, with authentication, posts/feed, comments, notifications, user profiles, and e-commerce.

**Architecture:** Monolithic Spring Boot REST API with PostgreSQL database, JWT authentication, Aliyun OSS for file storage, and Redis for caching hot data.

**Tech Stack:** Java 17+, Spring Boot 3.x, Spring Security, PostgreSQL, Redis, Aliyun OSS SDK, Flyway for migrations, JUnit 5 + Mockito for testing

---

## Tasks 1-6: Authentication & SMS (Already Completed - See Original Plan)

Tasks 1-6 are detailed in the original plan document. They cover:
- Task 1: Project Setup & Configuration
- Task 2: Database Schema - Users & Authentication
- Task 3: SMS Verification Service (Mock)
- Task 4: JWT Authentication Service
- Task 5: Authentication REST API - Send SMS
- Task 6: Authentication REST API - Verify SMS & Login

---

## Task 7: Spring Security Configuration - JWT Authentication Filter

**Files:**
- Create: `src/main/java/com/allesgut/security/JwtAuthenticationFilter.java`
- Create: `src/main/java/com/allesgut/config/SecurityConfig.java`
- Create: `src/main/java/com/allesgut/security/UserDetailsServiceImpl.java`
- Create: `src/test/java/com/allesgut/security/JwtAuthenticationFilterTests.java`

**Step 1: Write test for JWT authentication filter**

Create: `src/test/java/com/allesgut/security/JwtAuthenticationFilterTests.java`

```java
package com.allesgut.security;

import com.allesgut.entity.User;
import com.allesgut.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Optional;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class JwtAuthenticationFilterTests {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @MockBean
    private UserRepository userRepository;

    @Test
    void shouldAllowRequestWithValidToken() throws Exception {
        // Given
        User user = User.builder()
                .id(UUID.randomUUID())
                .phone("13800138000")
                .nickname("Test User")
                .build();

        when(userRepository.findById(any(UUID.class))).thenReturn(Optional.of(user));

        String token = jwtService.generateToken(user);

        // When/Then
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void shouldRejectRequestWithoutToken() throws Exception {
        // When/Then
        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void shouldRejectRequestWithInvalidToken() throws Exception {
        // When/Then
        mockMvc.perform(get("/api/auth/me")
                        .header("Authorization", "Bearer invalid.token.here"))
                .andExpect(status().isUnauthorized());
    }
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=JwtAuthenticationFilterTests`
Expected: FAIL with "Security configuration not found"

**Step 3: Create JWT Authentication Filter**

Create: `src/main/java/com/allesgut/security/JwtAuthenticationFilter.java`

```java
package com.allesgut.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            String authHeader = request.getHeader("Authorization");

            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                filterChain.doFilter(request, response);
                return;
            }

            String token = authHeader.substring(7);

            if (!jwtService.validateToken(token)) {
                filterChain.doFilter(request, response);
                return;
            }

            UUID userId = jwtService.extractUserId(token);
            UserDetails userDetails = userDetailsService.loadUserByUsername(userId.toString());

            if (userDetails != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(
                                userDetails,
                                null,
                                userDetails.getAuthorities()
                        );
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            log.debug("Failed to set user authentication: {}", e.getMessage());
        }

        filterChain.doFilter(request, response);
    }
}
```

**Step 4: Create UserDetailsService implementation**

Create: `src/main/java/com/allesgut/security/UserDetailsServiceImpl.java`

```java
package com.allesgut.security;

import com.allesgut.entity.User;
import com.allesgut.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        UUID userId = UUID.fromString(username);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with id: " + userId));

        return new org.springframework.security.core.userdetails.User(
                user.getId().toString(),
                "", // No password for phone-based auth
                new ArrayList<>() // No roles for now
        );
    }
}
```

**Step 5: Create Security Configuration**

Create: `src/main/java/com/allesgut/config/SecurityConfig.java`

```java
package com.allesgut.config;

import com.allesgut.security.JwtAuthenticationFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/health").permitAll()
                        .anyRequest().authenticated()
                )
                .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList("http://localhost:3000", "https://allesgut.com"));
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("*"));
        configuration.setAllowCredentials(true);
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/api/**", configuration);
        return source;
    }
}
```

**Step 6: Add /me endpoint to AuthController**

Modify: `src/main/java/com/allesgut/controller/AuthController.java`

```java
@GetMapping("/me")
public ResponseEntity<ApiResponse<UserDto>> getCurrentUser(Authentication authentication) {
    if (authentication == null || !authentication.isAuthenticated()) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(ApiResponse.error("Not authenticated"));
    }

    UUID userId = UUID.fromString(authentication.getName());
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

    UserDto userDto = mapToDto(user);
    return ResponseEntity.ok(ApiResponse.success(userDto));
}
```

**Step 7: Run test to verify it passes**

Run: `mvn test -Dtest=JwtAuthenticationFilterTests`
Expected: PASS - JWT authentication filter works correctly

**Step 8: Commit**

```bash
git add src/main/java/com/allesgut/security/ src/main/java/com/allesgut/config/SecurityConfig.java src/test/java/com/allesgut/security/JwtAuthenticationFilterTests.java
git commit -m "feat: add Spring Security with JWT authentication filter"
```

---

## Task 8: Authentication API - Logout

**Files:**
- Modify: `src/main/java/com/allesgut/controller/AuthController.java`
- Modify: `src/main/java/com/allesgut/service/AuthService.java`
- Modify: `src/test/java/com/allesgut/controller/AuthControllerTests.java`

**Step 1: Write test for logout endpoint**

Add to: `src/test/java/com/allesgut/controller/AuthControllerTests.java`

```java
@Test
@WithMockUser
void shouldLogoutSuccessfully() throws Exception {
    // Given
    doNothing().when(authService).logout(anyString());

    // When/Then
    mockMvc.perform(post("/api/auth/logout")
                    .header("Authorization", "Bearer test-token"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.success").value(true));
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=AuthControllerTests#shouldLogoutSuccessfully`
Expected: FAIL with "No mapping for POST /api/auth/logout"

**Step 3: Add logout method to AuthService**

Modify: `src/main/java/com/allesgut/service/AuthService.java`

```java
@Transactional
public void logout(String token) {
    sessionRepository.deleteByToken(token);
}
```

**Step 4: Add logout endpoint to AuthController**

Modify: `src/main/java/com/allesgut/controller/AuthController.java`

```java
@PostMapping("/logout")
public ResponseEntity<ApiResponse<Void>> logout(
        @RequestHeader(value = "Authorization", required = false) String authHeader) {
    if (authHeader != null && authHeader.startsWith("Bearer ")) {
        String token = authHeader.substring(7);
        authService.logout(token);
    }
    return ResponseEntity.ok(ApiResponse.success("Logged out successfully"));
}
```

**Step 5: Run test to verify it passes**

Run: `mvn test -Dtest=AuthControllerTests#shouldLogoutSuccessfully`
Expected: PASS - logout works correctly

**Step 6: Commit**

```bash
git add src/main/java/com/allesgut/controller/AuthController.java src/main/java/com/allesgut/service/AuthService.java src/test/java/com/allesgut/controller/AuthControllerTests.java
git commit -m "feat: add logout endpoint"
```

---

## Task 9: Database Schema - Posts & Tags

**Files:**
- Create: `src/main/resources/db/migration/V002__create_posts_and_tags_tables.sql`
- Create: `src/main/java/com/allesgut/entity/Post.java`
- Create: `src/main/java/com/allesgut/entity/Tag.java`
- Create: `src/main/java/com/allesgut/repository/PostRepository.java`
- Create: `src/main/java/com/allesgut/repository/TagRepository.java`
- Create: `src/test/java/com/allesgut/repository/PostRepositoryTests.java`

**Step 1: Write test for Post repository**

Create: `src/test/java/com/allesgut/repository/PostRepositoryTests.java`

```java
package com.allesgut.repository;

import com.allesgut.entity.Post;
import com.allesgut.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Transactional
class PostRepositoryTests {

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .phone("13800138000")
                .nickname("Test User")
                .build();
        testUser = userRepository.save(testUser);
    }

    @Test
    void shouldSaveAndFindPost() {
        // Given
        Post post = Post.builder()
                .userId(testUser.getId())
                .title("Test Post")
                .content("This is a test post")
                .build();

        // When
        Post savedPost = postRepository.save(post);
        Post foundPost = postRepository.findById(savedPost.getId()).orElse(null);

        // Then
        assertThat(foundPost).isNotNull();
        assertThat(foundPost.getTitle()).isEqualTo("Test Post");
        assertThat(foundPost.getUserId()).isEqualTo(testUser.getId());
    }

    @Test
    void shouldFindPostsByUserId() {
        // Given
        Post post1 = Post.builder()
                .userId(testUser.getId())
                .title("Post 1")
                .content("Content 1")
                .build();
        Post post2 = Post.builder()
                .userId(testUser.getId())
                .title("Post 2")
                .content("Content 2")
                .build();

        postRepository.save(post1);
        postRepository.save(post2);

        // When
        Page<Post> posts = postRepository.findByUserIdOrderByCreatedAtDesc(
                testUser.getId(), PageRequest.of(0, 10));

        // Then
        assertThat(posts.getContent()).hasSize(2);
    }
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=PostRepositoryTests`
Expected: FAIL with "Post class not found"

**Step 3: Create Flyway migration script**

Create: `src/main/resources/db/migration/V002__create_posts_and_tags_tables.sql`

```sql
-- Posts table
CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(100) NOT NULL,
    content TEXT NOT NULL,
    media_type VARCHAR(20),
    media_urls JSONB,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    favorites_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_posts_user_created ON posts(user_id, created_at DESC);

-- Tags table
CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tags_name ON tags(name);
CREATE INDEX idx_tags_usage ON tags(usage_count DESC);

-- Post tags junction table
CREATE TABLE post_tags (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

CREATE INDEX idx_post_tags_tag ON post_tags(tag_id);

-- Post likes
CREATE TABLE post_likes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id)
);

CREATE INDEX idx_post_likes_post ON post_likes(post_id);

-- Post favorites
CREATE TABLE post_favorites (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, post_id)
);

CREATE INDEX idx_post_favorites_user ON post_favorites(user_id);
CREATE INDEX idx_post_favorites_post ON post_favorites(post_id);

-- User follows
CREATE TABLE user_follows (
    follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (follower_id, following_id)
);

CREATE INDEX idx_follows_follower ON user_follows(follower_id);
CREATE INDEX idx_follows_following ON user_follows(following_id);
```

**Step 4: Create Post entity**

Create: `src/main/java/com/allesgut/entity/Post.java`

```java
package com.allesgut.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "posts")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Post {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "media_type", length = 20)
    private String mediaType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "media_urls", columnDefinition = "jsonb")
    private List<String> mediaUrls;

    @Column(name = "likes_count")
    private Integer likesCount = 0;

    @Column(name = "comments_count")
    private Integer commentsCount = 0;

    @Column(name = "favorites_count")
    private Integer favoritesCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

**Step 5: Create Tag entity**

Create: `src/main/java/com/allesgut/entity/Tag.java`

```java
package com.allesgut.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "tags")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tag {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String name;

    @Column(name = "usage_count")
    private Integer usageCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

**Step 6: Create repositories**

Create: `src/main/java/com/allesgut/repository/PostRepository.java`

```java
package com.allesgut.repository;

import com.allesgut.entity.Post;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PostRepository extends JpaRepository<Post, UUID> {
    Page<Post> findByUserIdOrderByCreatedAtDesc(UUID userId, Pageable pageable);
    Page<Post> findAllByOrderByCreatedAtDesc(Pageable pageable);
}
```

Create: `src/main/java/com/allesgut/repository/TagRepository.java`

```java
package com.allesgut.repository;

import com.allesgut.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TagRepository extends JpaRepository<Tag, Long> {
    Optional<Tag> findByName(String name);
}
```

**Step 7: Run test to verify it passes**

Run: `mvn test -Dtest=PostRepositoryTests`
Expected: PASS - posts are saved and retrieved correctly

**Step 8: Commit**

```bash
git add src/main/resources/db/migration/V002__create_posts_and_tags_tables.sql src/main/java/com/allesgut/entity/Post.java src/main/java/com/allesgut/entity/Tag.java src/main/java/com/allesgut/repository/PostRepository.java src/main/java/com/allesgut/repository/TagRepository.java src/test/java/com/allesgut/repository/PostRepositoryTests.java
git commit -m "feat: add Post and Tag entities with database migration"
```

---

## Task 10: Posts Service - Create Post

**Files:**
- Create: `src/main/java/com/allesgut/service/PostService.java`
- Create: `src/main/java/com/allesgut/dto/request/CreatePostRequest.java`
- Create: `src/main/java/com/allesgut/dto/response/PostDto.java`
- Create: `src/test/java/com/allesgut/service/PostServiceTests.java`

**Step 1: Write test for PostService**

Create: `src/test/java/com/allesgut/service/PostServiceTests.java`

```java
package com.allesgut.service;

import com.allesgut.dto.request.CreatePostRequest;
import com.allesgut.dto.response.PostDto;
import com.allesgut.entity.Post;
import com.allesgut.entity.Tag;
import com.allesgut.entity.User;
import com.allesgut.repository.PostRepository;
import com.allesgut.repository.TagRepository;
import com.allesgut.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PostServiceTests {

    @Mock
    private PostRepository postRepository;

    @Mock
    private TagRepository tagRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private PostService postService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .phone("13800138000")
                .nickname("Test User")
                .postsCount(0)
                .build();
    }

    @Test
    void shouldCreatePostSuccessfully() {
        // Given
        CreatePostRequest request = new CreatePostRequest(
                "Test Title",
                "Test Content",
                null,
                null,
                List.of("tag1", "tag2")
        );

        when(userRepository.findById(any(UUID.class))).thenReturn(Optional.of(testUser));
        when(tagRepository.findByName(anyString())).thenReturn(Optional.empty());
        when(tagRepository.save(any(Tag.class))).thenAnswer(invocation -> {
            Tag tag = invocation.getArgument(0);
            tag.setId(1L);
            return tag;
        });
        when(postRepository.save(any(Post.class))).thenAnswer(invocation -> {
            Post post = invocation.getArgument(0);
            post.setId(UUID.randomUUID());
            return post;
        });

        // When
        PostDto result = postService.createPost(testUser.getId(), request);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.title()).isEqualTo("Test Title");
        assertThat(result.content()).isEqualTo("Test Content");
        verify(postRepository).save(any(Post.class));
        verify(userRepository).save(testUser);
        assertThat(testUser.getPostsCount()).isEqualTo(1);
    }

    @Test
    void shouldThrowExceptionForInvalidTitle() {
        // Given
        CreatePostRequest request = new CreatePostRequest(
                "", // Invalid empty title
                "Test Content",
                null,
                null,
                List.of()
        );

        // When/Then
        assertThatThrownBy(() -> postService.createPost(testUser.getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Title is required");
    }
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=PostServiceTests`
Expected: FAIL with "PostService class not found"

**Step 3: Create DTOs**

Create: `src/main/java/com/allesgut/dto/request/CreatePostRequest.java`

```java
package com.allesgut.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public record CreatePostRequest(
        @NotBlank(message = "Title is required")
        @Size(max = 100, message = "Title must not exceed 100 characters")
        String title,

        @NotBlank(message = "Content is required")
        @Size(max = 1000, message = "Content must not exceed 1000 characters")
        String content,

        String mediaType,

        @Size(max = 9, message = "Maximum 9 media files allowed")
        List<String> mediaUrls,

        @Size(max = 5, message = "Maximum 5 tags allowed")
        List<String> tags
) {}
```

Create: `src/main/java/com/allesgut/dto/response/PostDto.java`

```java
package com.allesgut.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record PostDto(
        UUID id,
        UserDto author,
        String title,
        String content,
        String mediaType,
        List<String> mediaUrls,
        List<String> tags,
        Integer likesCount,
        Integer commentsCount,
        Integer favoritesCount,
        Boolean isLiked,
        Boolean isFavorited,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
```

**Step 4: Create PostService**

Create: `src/main/java/com/allesgut/service/PostService.java`

```java
package com.allesgut.service;

import com.allesgut.dto.request.CreatePostRequest;
import com.allesgut.dto.response.PostDto;
import com.allesgut.dto.response.UserDto;
import com.allesgut.entity.Post;
import com.allesgut.entity.Tag;
import com.allesgut.entity.User;
import com.allesgut.repository.PostRepository;
import com.allesgut.repository.TagRepository;
import com.allesgut.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;

    @Transactional
    public PostDto createPost(UUID userId, CreatePostRequest request) {
        // Validate input
        if (request.title() == null || request.title().trim().isEmpty()) {
            throw new IllegalArgumentException("Title is required");
        }
        if (request.content() == null || request.content().trim().isEmpty()) {
            throw new IllegalArgumentException("Content is required");
        }

        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Create post
        Post post = Post.builder()
                .userId(userId)
                .title(request.title())
                .content(request.content())
                .mediaType(request.mediaType())
                .mediaUrls(request.mediaUrls())
                .build();

        post = postRepository.save(post);

        // Handle tags
        List<String> tagNames = new ArrayList<>();
        if (request.tags() != null) {
            for (String tagName : request.tags()) {
                Tag tag = tagRepository.findByName(tagName)
                        .orElseGet(() -> {
                            Tag newTag = Tag.builder()
                                    .name(tagName)
                                    .usageCount(0)
                                    .build();
                            return tagRepository.save(newTag);
                        });
                tag.setUsageCount(tag.getUsageCount() + 1);
                tagRepository.save(tag);
                tagNames.add(tag.getName());
            }
        }

        // Increment user posts count
        user.setPostsCount(user.getPostsCount() + 1);
        userRepository.save(user);

        // Return DTO
        return mapToDto(post, user, tagNames, false, false);
    }

    private PostDto mapToDto(Post post, User author, List<String> tags,
                             boolean isLiked, boolean isFavorited) {
        UserDto authorDto = new UserDto(
                author.getId(),
                author.getPhone(),
                author.getNickname(),
                author.getAvatarUrl(),
                author.getBio(),
                author.getPostsCount(),
                author.getFollowersCount(),
                author.getFollowingCount()
        );

        return new PostDto(
                post.getId(),
                authorDto,
                post.getTitle(),
                post.getContent(),
                post.getMediaType(),
                post.getMediaUrls(),
                tags,
                post.getLikesCount(),
                post.getCommentsCount(),
                post.getFavoritesCount(),
                isLiked,
                isFavorited,
                post.getCreatedAt(),
                post.getUpdatedAt()
        );
    }
}
```

**Step 5: Run test to verify it passes**

Run: `mvn test -Dtest=PostServiceTests`
Expected: PASS - post creation works correctly

**Step 6: Commit**

```bash
git add src/main/java/com/allesgut/service/PostService.java src/main/java/com/allesgut/dto/ src/test/java/com/allesgut/service/PostServiceTests.java
git commit -m "feat: add PostService with create post functionality"
```

---

_Due to length constraints, I'll continue with the remaining tasks in a structured format..._

## Remaining Tasks Summary (11-50)

### Tasks 11-15: Posts REST API & Feed
- Task 11: Create Post endpoint
- Task 12: Get posts feed (recommended/following)
- Task 13: Get single post details
- Task 14: Like/unlike post endpoints
- Task 15: Favorite/unfavorite post endpoints

### Tasks 16-20: Comments System
- Task 16: Comments database schema & entities
- Task 17: Comments service
- Task 18: Create/delete comment endpoints
- Task 19: Nested replies support
- Task 20: Like comment endpoints

### Tasks 21-25: User Profile & Follow System
- Task 21: Get user profile endpoint
- Task 22: Update user profile endpoint
- Task 23: Follow/unfollow endpoints
- Task 24: Get followers/following lists
- Task 25: User search endpoint

### Tasks 26-30: Notifications System
- Task 26: Notifications database schema
- Task 27: Notification service
- Task 28: Get notifications endpoint
- Task 29: Mark notifications as read
- Task 30: Notification creation for user actions

### Tasks 31-35: File Upload with Aliyun OSS
- Task 31: Aliyun OSS configuration
- Task 32: Image upload endpoint
- Task 33: Video upload endpoint
- Task 34: File validation service
- Task 35: OSS integration tests

### Tasks 36-40: E-commerce/Mall Features
- Task 36: Products database schema
- Task 37: Products service & endpoints
- Task 38: Orders database schema
- Task 39: Create order endpoint
- Task 40: Order management endpoints

### Tasks 41-45: Performance Optimization
- Task 41: Redis cache configuration
- Task 42: Cache user sessions in Redis
- Task 43: Cache hot posts in Redis
- Task 44: Database query optimization
- Task 45: Add database connection pooling

### Tasks 46-50: Documentation & Final Polish
- Task 46: Swagger/OpenAPI configuration
- Task 47: Add API documentation annotations
- Task 48: Integration tests for all controllers
- Task 49: Performance testing
- Task 50: Final security audit & rate limiting

---

## Testing Strategy

**Unit Tests**: Service layer with mocked repositories
**Integration Tests**: Controller layer with @SpringBootTest + MockMvc
**Repository Tests**: @DataJpaTest with TestContainers

**Test Coverage Goals**:
- Service layer: 90%+
- Controller layer: 85%+
- Repository layer: Basic CRUD operations

---

## Execution Notes

- Use TestContainers for integration tests with real PostgreSQL
- Follow DRY principle - extract common code to utilities
- Follow YAGNI - only implement what's in the requirements
- Commit frequently after each passing test
- Run full test suite before each commit: `mvn test`
- Use Flyway for all database schema changes
- Keep services thin - move complex logic to domain entities when appropriate

---

**Note:** This is a complete overview. Each task (11-50) should follow the same detailed TDD pattern as tasks 1-10 when implementing.
