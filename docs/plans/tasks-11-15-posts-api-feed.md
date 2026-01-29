# Tasks 11-15: Posts REST API & Feed System

## Task 11: Posts REST API - Create Post Endpoint

**Files:**
- Create: `src/main/java/com/allesgut/controller/PostsController.java`
- Modify: `src/test/java/com/allesgut/controller/PostsControllerTests.java`

**Step 1: Write test for create post endpoint**

Create: `src/test/java/com/allesgut/controller/PostsControllerTests.java`

```java
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
    @WithMockUser
    void shouldCreatePostSuccessfully() throws Exception {
        // Given
        UUID userId = UUID.randomUUID();
        CreatePostRequest request = new CreatePostRequest(
                "Test Post",
                "This is test content",
                null,
                null,
                List.of("tag1", "tag2")
        );

        UserDto author = new UserDto(userId, "13800138000", "Test User",
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
    @WithMockUser
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

        // When/Then
        mockMvc.perform(post("/api/posts")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=PostsControllerTests`
Expected: FAIL with "No mapping for POST /api/posts"

**Step 3: Create PostsController**

Create: `src/main/java/com/allesgut/controller/PostsController.java`

```java
package com.allesgut.controller;

import com.allesgut.dto.request.CreatePostRequest;
import com.allesgut.dto.response.ApiResponse;
import com.allesgut.dto.response.PostDto;
import com.allesgut.service.PostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/posts")
@RequiredArgsConstructor
public class PostsController {

    private final PostService postService;

    @PostMapping
    public ResponseEntity<ApiResponse<PostDto>> createPost(
            @Valid @RequestBody CreatePostRequest request,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        PostDto post = postService.createPost(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(post));
    }
}
```

**Step 4: Run test to verify it passes**

Run: `mvn test -Dtest=PostsControllerTests`
Expected: PASS - create post endpoint works correctly

**Step 5: Commit**

```bash
git add src/main/java/com/allesgut/controller/PostsController.java src/test/java/com/allesgut/controller/PostsControllerTests.java
git commit -m "feat: add create post REST API endpoint"
```

---

## Task 12: Get Posts Feed (Recommended & Following)

**Files:**
- Modify: `src/main/java/com/allesgut/service/PostService.java`
- Modify: `src/main/java/com/allesgut/controller/PostsController.java`
- Create: `src/main/java/com/allesgut/dto/response/PageResponse.java`
- Modify: `src/test/java/com/allesgut/service/PostServiceTests.java`

**Step 1: Write test for feed endpoints**

Add to: `src/test/java/com/allesgut/service/PostServiceTests.java`

```java
@Test
void shouldGetRecommendedFeed() {
    // Given
    Post post = Post.builder()
            .id(UUID.randomUUID())
            .userId(testUser.getId())
            .title("Test Post")
            .content("Content")
            .build();

    Page<Post> postsPage = new PageImpl<>(List.of(post));
    when(postRepository.findAllByOrderByCreatedAtDesc(any(Pageable.class)))
            .thenReturn(postsPage);
    when(userRepository.findById(any(UUID.class)))
            .thenReturn(Optional.of(testUser));

    // When
    PageResponse<PostDto> result = postService.getFeed("recommended", null, 0, 20, null);

    // Then
    assertThat(result.getData()).hasSize(1);
    assertThat(result.getTotal()).isEqualTo(1);
}

@Test
void shouldGetFollowingFeed() {
    // Given
    UUID currentUserId = UUID.randomUUID();
    Post post = Post.builder()
            .id(UUID.randomUUID())
            .userId(testUser.getId())
            .title("Test Post")
            .content("Content")
            .build();

    Page<Post> postsPage = new PageImpl<>(List.of(post));
    when(postRepository.findByUserIdInOrderByCreatedAtDesc(anyList(), any(Pageable.class)))
            .thenReturn(postsPage);
    when(userRepository.findById(any(UUID.class)))
            .thenReturn(Optional.of(testUser));

    // When
    PageResponse<PostDto> result = postService.getFeed("following", currentUserId, 0, 20, null);

    // Then
    assertThat(result.getData()).hasSize(1);
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=PostServiceTests#shouldGetRecommendedFeed`
Expected: FAIL with "Method not found"

**Step 3: Create PageResponse DTO**

Create: `src/main/java/com/allesgut/dto/response/PageResponse.java`

```java
package com.allesgut.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PageResponse<T> {
    private List<T> data;
    private int page;
    private int limit;
    private long total;
    private int totalPages;

    public static <T> PageResponse<T> of(List<T> data, int page, int limit, long total) {
        int totalPages = (int) Math.ceil((double) total / limit);
        return new PageResponse<>(data, page, limit, total, totalPages);
    }
}
```

**Step 4: Add feed methods to PostService**

Modify: `src/main/java/com/allesgut/service/PostService.java`

```java
@Autowired
private UserFollowRepository userFollowRepository;

@Autowired
private PostLikeRepository postLikeRepository;

@Autowired
private PostFavoriteRepository postFavoriteRepository;

public PageResponse<PostDto> getFeed(String feedType, UUID currentUserId,
                                     int page, int limit, String tag) {
    Pageable pageable = PageRequest.of(page, limit);
    Page<Post> postsPage;

    if ("following".equals(feedType) && currentUserId != null) {
        // Get posts from users that current user follows
        List<UUID> followingIds = userFollowRepository
                .findByFollowerId(currentUserId)
                .stream()
                .map(UserFollow::getFollowingId)
                .toList();

        if (followingIds.isEmpty()) {
            return PageResponse.of(List.of(), page, limit, 0);
        }

        postsPage = postRepository.findByUserIdInOrderByCreatedAtDesc(followingIds, pageable);
    } else {
        // Recommended feed - all posts
        postsPage = postRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    // Convert to DTOs
    List<PostDto> postDtos = postsPage.getContent().stream()
            .map(post -> {
                User author = userRepository.findById(post.getUserId())
                        .orElse(null);
                boolean isLiked = currentUserId != null &&
                        postLikeRepository.existsByUserIdAndPostId(currentUserId, post.getId());
                boolean isFavorited = currentUserId != null &&
                        postFavoriteRepository.existsByUserIdAndPostId(currentUserId, post.getId());

                return mapToDto(post, author, List.of(), isLiked, isFavorited);
            })
            .toList();

    return PageResponse.of(postDtos, page, limit, postsPage.getTotalElements());
}
```

**Step 5: Add feed endpoint to controller**

Modify: `src/main/java/com/allesgut/controller/PostsController.java`

```java
@GetMapping
public ResponseEntity<ApiResponse<PageResponse<PostDto>>> getFeed(
        @RequestParam(defaultValue = "recommended") String feedType,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int limit,
        @RequestParam(required = false) String tag,
        Authentication authentication) {

    UUID currentUserId = authentication != null
            ? UUID.fromString(authentication.getName())
            : null;

    PageResponse<PostDto> feed = postService.getFeed(feedType, currentUserId, page, limit, tag);
    return ResponseEntity.ok(ApiResponse.success(feed));
}
```

**Step 6: Create necessary repositories**

Create: `src/main/java/com/allesgut/repository/UserFollowRepository.java`

```java
package com.allesgut.repository;

import com.allesgut.entity.UserFollow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserFollowRepository extends JpaRepository<UserFollow, Long> {
    List<UserFollow> findByFollowerId(UUID followerId);
    boolean existsByFollowerIdAndFollowingId(UUID followerId, UUID followingId);
    void deleteByFollowerIdAndFollowingId(UUID followerId, UUID followingId);
}
```

Create: `src/main/java/com/allesgut/repository/PostLikeRepository.java`

```java
package com.allesgut.repository;

import com.allesgut.entity.PostLike;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PostLikeRepository extends JpaRepository<PostLike, Long> {
    boolean existsByUserIdAndPostId(UUID userId, UUID postId);
    void deleteByUserIdAndPostId(UUID userId, UUID postId);
}
```

Create: `src/main/java/com/allesgut/repository/PostFavoriteRepository.java`

```java
package com.allesgut.repository;

import com.allesgut.entity.PostFavorite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface PostFavoriteRepository extends JpaRepository<PostFavorite, Long> {
    boolean existsByUserIdAndPostId(UUID userId, UUID postId);
    void deleteByUserIdAndPostId(UUID userId, UUID postId);
}
```

**Step 7: Create necessary entities**

Create: `src/main/java/com/allesgut/entity/UserFollow.java`

```java
package com.allesgut.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "user_follows")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(UserFollowId.class)
public class UserFollow {

    @Id
    @Column(name = "follower_id")
    private UUID followerId;

    @Id
    @Column(name = "following_id")
    private UUID followingId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

Create: `src/main/java/com/allesgut/entity/UserFollowId.java`

```java
package com.allesgut.entity;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserFollowId implements Serializable {
    private UUID followerId;
    private UUID followingId;
}
```

Create similar entities for `PostLike` and `PostFavorite`

**Step 8: Run test to verify it passes**

Run: `mvn test -Dtest=PostServiceTests`
Expected: PASS - feed endpoints work correctly

**Step 9: Commit**

```bash
git add .
git commit -m "feat: add posts feed API with recommended and following modes"
```

---

## Task 13: Get Single Post Details

**Files:**
- Modify: `src/main/java/com/allesgut/service/PostService.java`
- Modify: `src/main/java/com/allesgut/controller/PostsController.java`
- Modify: `src/test/java/com/allesgut/service/PostServiceTests.java`

**Step 1: Write test for get post by ID**

Add to: `src/test/java/com/allesgut/service/PostServiceTests.java`

```java
@Test
void shouldGetPostById() {
    // Given
    UUID postId = UUID.randomUUID();
    Post post = Post.builder()
            .id(postId)
            .userId(testUser.getId())
            .title("Test Post")
            .content("Content")
            .build();

    when(postRepository.findById(postId)).thenReturn(Optional.of(post));
    when(userRepository.findById(testUser.getId())).thenReturn(Optional.of(testUser));

    // When
    PostDto result = postService.getPostById(postId, null);

    // Then
    assertThat(result).isNotNull();
    assertThat(result.title()).isEqualTo("Test Post");
}

@Test
void shouldThrowExceptionWhenPostNotFound() {
    // Given
    UUID postId = UUID.randomUUID();
    when(postRepository.findById(postId)).thenReturn(Optional.empty());

    // When/Then
    assertThatThrownBy(() -> postService.getPostById(postId, null))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("Post not found");
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=PostServiceTests#shouldGetPostById`
Expected: FAIL with "Method not found"

**Step 3: Add getPostById method to PostService**

Modify: `src/main/java/com/allesgut/service/PostService.java`

```java
public PostDto getPostById(UUID postId, UUID currentUserId) {
    Post post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));

    User author = userRepository.findById(post.getUserId())
            .orElseThrow(() -> new IllegalArgumentException("Author not found"));

    boolean isLiked = currentUserId != null &&
            postLikeRepository.existsByUserIdAndPostId(currentUserId, postId);
    boolean isFavorited = currentUserId != null &&
            postFavoriteRepository.existsByUserIdAndPostId(currentUserId, postId);

    // Get tags for this post (simplified - you'd need a proper junction table query)
    List<String> tags = List.of(); // TODO: Implement proper tag fetching

    return mapToDto(post, author, tags, isLiked, isFavorited);
}
```

**Step 4: Add endpoint to controller**

Modify: `src/main/java/com/allesgut/controller/PostsController.java`

```java
@GetMapping("/{id}")
public ResponseEntity<ApiResponse<PostDto>> getPostById(
        @PathVariable UUID id,
        Authentication authentication) {

    UUID currentUserId = authentication != null
            ? UUID.fromString(authentication.getName())
            : null;

    PostDto post = postService.getPostById(id, currentUserId);
    return ResponseEntity.ok(ApiResponse.success(post));
}
```

**Step 5: Run test to verify it passes**

Run: `mvn test -Dtest=PostServiceTests#shouldGetPostById`
Expected: PASS

**Step 6: Commit**

```bash
git add src/main/java/com/allesgut/service/PostService.java src/main/java/com/allesgut/controller/PostsController.java src/test/java/com/allesgut/service/PostServiceTests.java
git commit -m "feat: add get post by ID endpoint"
```

---

## Task 14: Like/Unlike Post Endpoints

**Files:**
- Modify: `src/main/java/com/allesgut/service/PostService.java`
- Modify: `src/main/java/com/allesgut/controller/PostsController.java`
- Modify: `src/test/java/com/allesgut/service/PostServiceTests.java`

**Step 1: Write test for like/unlike**

Add to: `src/test/java/com/allesgut/service/PostServiceTests.java`

```java
@Test
void shouldLikePost() {
    // Given
    UUID postId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    Post post = Post.builder()
            .id(postId)
            .userId(testUser.getId())
            .likesCount(0)
            .build();

    when(postRepository.findById(postId)).thenReturn(Optional.of(post));
    when(postLikeRepository.existsByUserIdAndPostId(userId, postId)).thenReturn(false);

    // When
    postService.likePost(postId, userId);

    // Then
    verify(postLikeRepository).save(any(PostLike.class));
    verify(postRepository).save(post);
    assertThat(post.getLikesCount()).isEqualTo(1);
}

@Test
void shouldUnlikePost() {
    // Given
    UUID postId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    Post post = Post.builder()
            .id(postId)
            .userId(testUser.getId())
            .likesCount(1)
            .build();

    when(postRepository.findById(postId)).thenReturn(Optional.of(post));
    when(postLikeRepository.existsByUserIdAndPostId(userId, postId)).thenReturn(true);

    // When
    postService.unlikePost(postId, userId);

    // Then
    verify(postLikeRepository).deleteByUserIdAndPostId(userId, postId);
    verify(postRepository).save(post);
    assertThat(post.getLikesCount()).isEqualTo(0);
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=PostServiceTests#shouldLikePost`
Expected: FAIL with "Method not found"

**Step 3: Add like/unlike methods to PostService**

Modify: `src/main/java/com/allesgut/service/PostService.java`

```java
@Transactional
public void likePost(UUID postId, UUID userId) {
    Post post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));

    // Check if already liked
    if (postLikeRepository.existsByUserIdAndPostId(userId, postId)) {
        throw new IllegalArgumentException("Post already liked");
    }

    // Create like
    PostLike like = PostLike.builder()
            .userId(userId)
            .postId(postId)
            .build();
    postLikeRepository.save(like);

    // Increment count
    post.setLikesCount(post.getLikesCount() + 1);
    postRepository.save(post);

    // TODO: Create notification for post author
}

@Transactional
public void unlikePost(UUID postId, UUID userId) {
    Post post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));

    // Check if liked
    if (!postLikeRepository.existsByUserIdAndPostId(userId, postId)) {
        throw new IllegalArgumentException("Post not liked");
    }

    // Delete like
    postLikeRepository.deleteByUserIdAndPostId(userId, postId);

    // Decrement count
    post.setLikesCount(Math.max(0, post.getLikesCount() - 1));
    postRepository.save(post);
}
```

**Step 4: Add endpoints to controller**

Modify: `src/main/java/com/allesgut/controller/PostsController.java`

```java
@PostMapping("/{id}/like")
public ResponseEntity<ApiResponse<Void>> likePost(
        @PathVariable UUID id,
        Authentication authentication) {
    UUID userId = UUID.fromString(authentication.getName());
    postService.likePost(id, userId);
    return ResponseEntity.ok(ApiResponse.success("Post liked"));
}

@DeleteMapping("/{id}/like")
public ResponseEntity<ApiResponse<Void>> unlikePost(
        @PathVariable UUID id,
        Authentication authentication) {
    UUID userId = UUID.fromString(authentication.getName());
    postService.unlikePost(id, userId);
    return ResponseEntity.ok(ApiResponse.success("Post unliked"));
}
```

**Step 5: Create PostLike entity**

Create: `src/main/java/com/allesgut/entity/PostLike.java`

```java
package com.allesgut.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "post_likes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(PostLikeId.class)
public class PostLike {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(name = "post_id")
    private UUID postId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

**Step 6: Run test to verify it passes**

Run: `mvn test -Dtest=PostServiceTests`
Expected: PASS

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add like/unlike post endpoints"
```

---

## Task 15: Favorite/Unfavorite Post Endpoints

**Files:**
- Modify: `src/main/java/com/allesgut/service/PostService.java`
- Modify: `src/main/java/com/allesgut/controller/PostsController.java`
- Create: `src/main/java/com/allesgut/entity/PostFavorite.java`
- Modify: `src/test/java/com/allesgut/service/PostServiceTests.java`

**Step 1: Write test for favorite/unfavorite**

Add to: `src/test/java/com/allesgut/service/PostServiceTests.java`

```java
@Test
void shouldFavoritePost() {
    // Given
    UUID postId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    Post post = Post.builder()
            .id(postId)
            .userId(testUser.getId())
            .favoritesCount(0)
            .build();

    when(postRepository.findById(postId)).thenReturn(Optional.of(post));
    when(postFavoriteRepository.existsByUserIdAndPostId(userId, postId)).thenReturn(false);

    // When
    postService.favoritePost(postId, userId);

    // Then
    verify(postFavoriteRepository).save(any(PostFavorite.class));
    verify(postRepository).save(post);
    assertThat(post.getFavoritesCount()).isEqualTo(1);
}

@Test
void shouldUnfavoritePost() {
    // Given
    UUID postId = UUID.randomUUID();
    UUID userId = UUID.randomUUID();
    Post post = Post.builder()
            .id(postId)
            .userId(testUser.getId())
            .favoritesCount(1)
            .build();

    when(postRepository.findById(postId)).thenReturn(Optional.of(post));
    when(postFavoriteRepository.existsByUserIdAndPostId(userId, postId)).thenReturn(true);

    // When
    postService.unfavoritePost(postId, userId);

    // Then
    verify(postFavoriteRepository).deleteByUserIdAndPostId(userId, postId);
    verify(postRepository).save(post);
    assertThat(post.getFavoritesCount()).isEqualTo(0);
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=PostServiceTests#shouldFavoritePost`
Expected: FAIL with "Method not found"

**Step 3: Add favorite/unfavorite methods to PostService**

Modify: `src/main/java/com/allesgut/service/PostService.java`

```java
@Transactional
public void favoritePost(UUID postId, UUID userId) {
    Post post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));

    if (postFavoriteRepository.existsByUserIdAndPostId(userId, postId)) {
        throw new IllegalArgumentException("Post already favorited");
    }

    PostFavorite favorite = PostFavorite.builder()
            .userId(userId)
            .postId(postId)
            .build();
    postFavoriteRepository.save(favorite);

    post.setFavoritesCount(post.getFavoritesCount() + 1);
    postRepository.save(post);
}

@Transactional
public void unfavoritePost(UUID postId, UUID userId) {
    Post post = postRepository.findById(postId)
            .orElseThrow(() -> new IllegalArgumentException("Post not found"));

    if (!postFavoriteRepository.existsByUserIdAndPostId(userId, postId)) {
        throw new IllegalArgumentException("Post not favorited");
    }

    postFavoriteRepository.deleteByUserIdAndPostId(userId, postId);

    post.setFavoritesCount(Math.max(0, post.getFavoritesCount() - 1));
    postRepository.save(post);
}
```

**Step 4: Add endpoints to controller**

Modify: `src/main/java/com/allesgut/controller/PostsController.java`

```java
@PostMapping("/{id}/favorite")
public ResponseEntity<ApiResponse<Void>> favoritePost(
        @PathVariable UUID id,
        Authentication authentication) {
    UUID userId = UUID.fromString(authentication.getName());
    postService.favoritePost(id, userId);
    return ResponseEntity.ok(ApiResponse.success("Post favorited"));
}

@DeleteMapping("/{id}/favorite")
public ResponseEntity<ApiResponse<Void>> unfavoritePost(
        @PathVariable UUID id,
        Authentication authentication) {
    UUID userId = UUID.fromString(authentication.getName());
    postService.unfavoritePost(id, userId);
    return ResponseEntity.ok(ApiResponse.success("Post unfavorited"));
}
```

**Step 5: Create PostFavorite entity**

Create: `src/main/java/com/allesgut/entity/PostFavorite.java`

```java
package com.allesgut.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "post_favorites")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(PostFavoriteId.class)
public class PostFavorite {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(name = "post_id")
    private UUID postId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

**Step 6: Run test to verify it passes**

Run: `mvn test -Dtest=PostServiceTests`
Expected: PASS

**Step 7: Commit**

```bash
git add .
git commit -m "feat: add favorite/unfavorite post endpoints"
```

---

## Summary

Tasks 11-15 complete the Posts REST API with:
- ✅ Create post endpoint
- ✅ Get posts feed (recommended/following)
- ✅ Get single post details
- ✅ Like/unlike posts
- ✅ Favorite/unfavorite posts

**Next:** Tasks 16-20 will implement the Comments System.
