# Tasks 16-20: Comments System - Detailed Implementation

## Task 16: Comments Database Schema & Entities

**Files:**
- Create: `src/main/resources/db/migration/V003__create_comments_tables.sql`
- Create: `src/main/java/com/allesgut/entity/Comment.java`
- Create: `src/main/java/com/allesgut/entity/CommentLike.java`
- Create: `src/main/java/com/allesgut/entity/CommentMention.java`
- Create: `src/main/java/com/allesgut/repository/CommentRepository.java`
- Create: `src/main/java/com/allesgut/repository/CommentLikeRepository.java`
- Create: `src/main/java/com/allesgut/repository/CommentMentionRepository.java`
- Create: `src/test/java/com/allesgut/repository/CommentRepositoryTests.java`

**Step 1: Write test for Comment repository**

Create: `src/test/java/com/allesgut/repository/CommentRepositoryTests.java`

```java
package com.allesgut.repository;

import com.allesgut.entity.Comment;
import com.allesgut.entity.Post;
import com.allesgut.entity.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
@Transactional
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
class CommentRepositoryTests {


    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private CommentRepository commentRepository;

    @Autowired
    private PostRepository postRepository;

    @Autowired
    private UserRepository userRepository;

    private User testUser;
    private Post testPost;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .phone("13800138000")
                .nickname("Test User")
                .build();
        testUser = userRepository.save(testUser);

        testPost = Post.builder()
                .userId(testUser.getId())
                .title("Test Post")
                .content("Test Content")
                .build();
        testPost = postRepository.save(testPost);
    }

    @Test
    void shouldSaveAndFindComment() {
        // Given
        Comment comment = Comment.builder()
                .postId(testPost.getId())
                .userId(testUser.getId())
                .content("Test Comment")
                .build();

        // When
        Comment savedComment = commentRepository.save(comment);
        Optional<Comment> foundComment = commentRepository.findById(savedComment.getId());

        // Then
        assertThat(foundComment).isPresent();
        assertThat(foundComment.get().getContent()).isEqualTo("Test Comment");
        assertThat(foundComment.get().getPostId()).isEqualTo(testPost.getId());
    }

    @Test
    void shouldFindCommentsByPostId() {
        // Given
        Comment comment1 = Comment.builder()
                .postId(testPost.getId())
                .userId(testUser.getId())
                .content("Comment 1")
                .build();
        Comment comment2 = Comment.builder()
                .postId(testPost.getId())
                .userId(testUser.getId())
                .content("Comment 2")
                .build();

        commentRepository.save(comment1);
        commentRepository.save(comment2);

        // When
        Page<Comment> comments = commentRepository.findByPostIdOrderByCreatedAtAsc(
                testPost.getId(), PageRequest.of(0, 10));

        // Then
        assertThat(comments.getContent()).hasSize(2);
        assertThat(comments.getContent().get(0).getContent()).isEqualTo("Comment 1");
    }

    @Test
    void shouldFindCommentsByParentId() {
        // Given
        Comment parentComment = Comment.builder()
                .postId(testPost.getId())
                .userId(testUser.getId())
                .content("Parent Comment")
                .build();
        parentComment = commentRepository.save(parentComment);

        Comment replyComment = Comment.builder()
                .postId(testPost.getId())
                .userId(testUser.getId())
                .parentId(parentComment.getId())
                .content("Reply Comment")
                .build();
        commentRepository.save(replyComment);

        // When
        List<Comment> replies = commentRepository.findByParentIdOrderByCreatedAtAsc(parentComment.getId());

        // Then
        assertThat(replies).hasSize(1);
        assertThat(replies.get(0).getContent()).isEqualTo("Reply Comment");
    }

    @Test
    void shouldCountCommentsByPostId() {
        // Given
        Comment comment1 = Comment.builder()
                .postId(testPost.getId())
                .userId(testUser.getId())
                .content("Comment 1")
                .build();
        Comment comment2 = Comment.builder()
                .postId(testPost.getId())
                .userId(testUser.getId())
                .content("Comment 2")
                .build();

        commentRepository.save(comment1);
        commentRepository.save(comment2);

        // When
        long count = commentRepository.countByPostId(testPost.getId());

        // Then
        assertThat(count).isEqualTo(2);
    }
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=CommentRepositoryTests`
Expected: FAIL with "Comment class not found"

**Step 3: Create Flyway migration script**

Create: `src/main/resources/db/migration/V003__create_comments_tables.sql`

```sql
-- Comments table
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_comments_post ON comments(post_id, created_at ASC);
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- Comment likes
CREATE TABLE comment_likes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, comment_id)
);

CREATE INDEX idx_comment_likes_comment ON comment_likes(comment_id);

-- Comment mentions
CREATE TABLE comment_mentions (
    comment_id UUID NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (comment_id, user_id)
);

CREATE INDEX idx_comment_mentions_user ON comment_mentions(user_id);
```

**Step 4: Create Comment entity**

Create: `src/main/java/com/allesgut/entity/Comment.java`

```java
package com.allesgut.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "comments")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Comment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "post_id", nullable = false)
    private UUID postId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String content;

    @Column(name = "likes_count")
    private Integer likesCount = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

**Step 5: Create CommentLike entity**

Create: `src/main/java/com/allesgut/entity/CommentLike.java`

```java
package com.allesgut.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "comment_likes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(CommentLikeId.class)
public class CommentLike {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(name = "comment_id")
    private UUID commentId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

Create: `src/main/java/com/allesgut/entity/CommentLikeId.java`

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
public class CommentLikeId implements Serializable {
    private UUID userId;
    private UUID commentId;
}
```

**Step 6: Create CommentMention entity**

Create: `src/main/java/com/allesgut/entity/CommentMention.java`

```java
package com.allesgut.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "comment_mentions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@IdClass(CommentMentionId.class)
public class CommentMention {

    @Id
    @Column(name = "comment_id")
    private UUID commentId;

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
```

Create: `src/main/java/com/allesgut/entity/CommentMentionId.java`

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
public class CommentMentionId implements Serializable {
    private UUID commentId;
    private UUID userId;
}
```

**Step 7: Create repositories**

Create: `src/main/java/com/allesgut/repository/CommentRepository.java`

```java
package com.allesgut.repository;

import com.allesgut.entity.Comment;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {
    Page<Comment> findByPostIdOrderByCreatedAtAsc(UUID postId, Pageable pageable);
    List<Comment> findByPostIdAndParentIdIsNullOrderByCreatedAtAsc(UUID postId);
    List<Comment> findByParentIdOrderByCreatedAtAsc(UUID parentId);
    long countByPostId(UUID postId);
    boolean existsByIdAndUserId(UUID id, UUID userId);
}
```

Create: `src/main/java/com/allesgut/repository/CommentLikeRepository.java`

```java
package com.allesgut.repository;

import com.allesgut.entity.CommentLike;
import com.allesgut.entity.CommentLikeId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface CommentLikeRepository extends JpaRepository<CommentLike, CommentLikeId> {
    boolean existsByUserIdAndCommentId(UUID userId, UUID commentId);
    void deleteByUserIdAndCommentId(UUID userId, UUID commentId);
}
```

Create: `src/main/java/com/allesgut/repository/CommentMentionRepository.java`

```java
package com.allesgut.repository;

import com.allesgut.entity.CommentMention;
import com.allesgut.entity.CommentMentionId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentMentionRepository extends JpaRepository<CommentMention, CommentMentionId> {
    List<CommentMention> findByCommentId(UUID commentId);
    List<CommentMention> findByUserId(UUID userId);
}
```

**Step 8: Run test to verify it passes**

Run: `mvn test -Dtest=CommentRepositoryTests`
Expected: PASS - comments are saved and retrieved correctly

**Step 9: Commit**

```bash
git add src/main/resources/db/migration/V003__create_comments_tables.sql src/main/java/com/allesgut/entity/Comment*.java src/main/java/com/allesgut/repository/Comment*.java src/test/java/com/allesgut/repository/CommentRepositoryTests.java
git commit -m "feat: add Comment entities, repositories and database migration"
```

---

## Task 17: Comments Service Layer

**Files:**
- Create: `src/main/java/com/allesgut/service/CommentService.java`
- Create: `src/main/java/com/allesgut/dto/request/CreateCommentRequest.java`
- Create: `src/main/java/com/allesgut/dto/response/CommentDto.java`
- Create: `src/test/java/com/allesgut/service/CommentServiceTests.java`

**Step 1: Write test for CommentService**

Create: `src/test/java/com/allesgut/service/CommentServiceTests.java`

```java
package com.allesgut.service;

import com.allesgut.dto.request.CreateCommentRequest;
import com.allesgut.dto.response.CommentDto;
import com.allesgut.dto.response.PageResponse;
import com.allesgut.entity.Comment;
import com.allesgut.entity.Post;
import com.allesgut.entity.User;
import com.allesgut.repository.CommentLikeRepository;
import com.allesgut.repository.CommentMentionRepository;
import com.allesgut.repository.CommentRepository;
import com.allesgut.repository.PostRepository;
import com.allesgut.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class CommentServiceTests {

    @Mock
    private CommentRepository commentRepository;

    @Mock
    private PostRepository postRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private CommentLikeRepository commentLikeRepository;

    @Mock
    private CommentMentionRepository commentMentionRepository;

    @InjectMocks
    private CommentService commentService;

    private User testUser;
    private Post testPost;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
                .id(UUID.randomUUID())
                .phone("13800138000")
                .nickname("Test User")
                .build();

        testPost = Post.builder()
                .id(UUID.randomUUID())
                .userId(testUser.getId())
                .title("Test Post")
                .content("Content")
                .commentsCount(0)
                .build();
    }

    @Test
    void shouldCreateCommentSuccessfully() {
        // Given
        CreateCommentRequest request = new CreateCommentRequest(
                "Test comment content",
                null,
                List.of()
        );

        when(postRepository.findById(any(UUID.class))).thenReturn(Optional.of(testPost));
        when(userRepository.findById(any(UUID.class))).thenReturn(Optional.of(testUser));
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
            Comment comment = invocation.getArgument(0);
            comment.setId(UUID.randomUUID());
            return comment;
        });

        // When
        CommentDto result = commentService.createComment(testPost.getId(), testUser.getId(), request);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.content()).isEqualTo("Test comment content");
        assertThat(result.author().nickname()).isEqualTo("Test User");
        verify(commentRepository).save(any(Comment.class));
        verify(postRepository).save(testPost);
        assertThat(testPost.getCommentsCount()).isEqualTo(1);
    }

    @Test
    void shouldCreateReplyCommentSuccessfully() {
        // Given
        UUID parentCommentId = UUID.randomUUID();
        Comment parentComment = Comment.builder()
                .id(parentCommentId)
                .postId(testPost.getId())
                .userId(testUser.getId())
                .content("Parent comment")
                .build();

        CreateCommentRequest request = new CreateCommentRequest(
                "Reply comment",
                parentCommentId,
                List.of()
        );

        when(postRepository.findById(any(UUID.class))).thenReturn(Optional.of(testPost));
        when(userRepository.findById(any(UUID.class))).thenReturn(Optional.of(testUser));
        when(commentRepository.findById(parentCommentId)).thenReturn(Optional.of(parentComment));
        when(commentRepository.save(any(Comment.class))).thenAnswer(invocation -> {
            Comment comment = invocation.getArgument(0);
            comment.setId(UUID.randomUUID());
            return comment;
        });

        // When
        CommentDto result = commentService.createComment(testPost.getId(), testUser.getId(), request);

        // Then
        assertThat(result).isNotNull();
        assertThat(result.parentId()).isEqualTo(parentCommentId);
        verify(commentRepository).save(any(Comment.class));
    }

    @Test
    void shouldThrowExceptionWhenPostNotFound() {
        // Given
        CreateCommentRequest request = new CreateCommentRequest("Content", null, List.of());
        when(postRepository.findById(any(UUID.class))).thenReturn(Optional.empty());

        // When/Then
        assertThatThrownBy(() -> commentService.createComment(UUID.randomUUID(), testUser.getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Post not found");
    }

    @Test
    void shouldThrowExceptionWhenContentEmpty() {
        // Given
        CreateCommentRequest request = new CreateCommentRequest("", null, List.of());

        // When/Then
        assertThatThrownBy(() -> commentService.createComment(testPost.getId(), testUser.getId(), request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Comment content is required");
    }

    @Test
    void shouldGetCommentsByPost() {
        // Given
        Comment comment = Comment.builder()
                .id(UUID.randomUUID())
                .postId(testPost.getId())
                .userId(testUser.getId())
                .content("Test comment")
                .build();

        Page<Comment> commentsPage = new PageImpl<>(List.of(comment));
        when(commentRepository.findByPostIdOrderByCreatedAtAsc(any(UUID.class), any(Pageable.class)))
                .thenReturn(commentsPage);
        when(userRepository.findById(any(UUID.class))).thenReturn(Optional.of(testUser));

        // When
        PageResponse<CommentDto> result = commentService.getCommentsByPost(testPost.getId(), null, 0, 20);

        // Then
        assertThat(result.getData()).hasSize(1);
        assertThat(result.getData().get(0).content()).isEqualTo("Test comment");
    }

    @Test
    void shouldDeleteCommentSuccessfully() {
        // Given
        UUID commentId = UUID.randomUUID();
        Comment comment = Comment.builder()
                .id(commentId)
                .postId(testPost.getId())
                .userId(testUser.getId())
                .content("Test comment")
                .build();

        when(commentRepository.findById(commentId)).thenReturn(Optional.of(comment));
        when(postRepository.findById(testPost.getId())).thenReturn(Optional.of(testPost));

        testPost.setCommentsCount(1);

        // When
        commentService.deleteComment(commentId, testUser.getId());

        // Then
        verify(commentRepository).delete(comment);
        verify(postRepository).save(testPost);
        assertThat(testPost.getCommentsCount()).isEqualTo(0);
    }

    @Test
    void shouldThrowExceptionWhenDeletingOthersComment() {
        // Given
        UUID commentId = UUID.randomUUID();
        UUID otherUserId = UUID.randomUUID();
        Comment comment = Comment.builder()
                .id(commentId)
                .postId(testPost.getId())
                .userId(otherUserId)
                .content("Test comment")
                .build();

        when(commentRepository.findById(commentId)).thenReturn(Optional.of(comment));

        // When/Then
        assertThatThrownBy(() -> commentService.deleteComment(commentId, testUser.getId()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("You can only delete your own comments");
    }

    @Test
    void shouldLikeCommentSuccessfully() {
        // Given
        UUID commentId = UUID.randomUUID();
        Comment comment = Comment.builder()
                .id(commentId)
                .postId(testPost.getId())
                .userId(testUser.getId())
                .likesCount(0)
                .build();

        when(commentRepository.findById(commentId)).thenReturn(Optional.of(comment));
        when(commentLikeRepository.existsByUserIdAndCommentId(testUser.getId(), commentId))
                .thenReturn(false);

        // When
        commentService.likeComment(commentId, testUser.getId());

        // Then
        verify(commentLikeRepository).save(any());
        verify(commentRepository).save(comment);
        assertThat(comment.getLikesCount()).isEqualTo(1);
    }

    @Test
    void shouldUnlikeCommentSuccessfully() {
        // Given
        UUID commentId = UUID.randomUUID();
        Comment comment = Comment.builder()
                .id(commentId)
                .postId(testPost.getId())
                .userId(testUser.getId())
                .likesCount(1)
                .build();

        when(commentRepository.findById(commentId)).thenReturn(Optional.of(comment));
        when(commentLikeRepository.existsByUserIdAndCommentId(testUser.getId(), commentId))
                .thenReturn(true);

        // When
        commentService.unlikeComment(commentId, testUser.getId());

        // Then
        verify(commentLikeRepository).deleteByUserIdAndCommentId(testUser.getId(), commentId);
        verify(commentRepository).save(comment);
        assertThat(comment.getLikesCount()).isEqualTo(0);
    }
}
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=CommentServiceTests`
Expected: FAIL with "CommentService class not found"

**Step 3: Create DTOs**

Create: `src/main/java/com/allesgut/dto/request/CreateCommentRequest.java`

```java
package com.allesgut.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public record CreateCommentRequest(
        @NotBlank(message = "Comment content is required")
        @Size(max = 500, message = "Comment must not exceed 500 characters")
        String content,

        UUID parentId,

        @Size(max = 5, message = "Maximum 5 mentions allowed")
        List<UUID> mentions
) {}
```

Create: `src/main/java/com/allesgut/dto/response/CommentDto.java`

```java
package com.allesgut.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

public record CommentDto(
        UUID id,
        UserDto author,
        UUID postId,
        UUID parentId,
        String content,
        Integer likesCount,
        Boolean isLiked,
        List<UserDto> mentions,
        List<CommentDto> replies,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {}
```

**Step 4: Create CommentService**

Create: `src/main/java/com/allesgut/service/CommentService.java`

```java
package com.allesgut.service;

import com.allesgut.dto.request.CreateCommentRequest;
import com.allesgut.dto.response.CommentDto;
import com.allesgut.dto.response.PageResponse;
import com.allesgut.dto.response.UserDto;
import com.allesgut.entity.*;
import com.allesgut.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentLikeRepository commentLikeRepository;
    private final CommentMentionRepository commentMentionRepository;

    @Transactional
    public CommentDto createComment(UUID postId, UUID userId, CreateCommentRequest request) {
        // Validate input
        if (request.content() == null || request.content().trim().isEmpty()) {
            throw new IllegalArgumentException("Comment content is required");
        }

        // Get post
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Validate parent comment if provided
        if (request.parentId() != null) {
            Comment parentComment = commentRepository.findById(request.parentId())
                    .orElseThrow(() -> new IllegalArgumentException("Parent comment not found"));

            // Ensure parent belongs to same post
            if (!parentComment.getPostId().equals(postId)) {
                throw new IllegalArgumentException("Parent comment does not belong to this post");
            }
        }

        // Create comment
        Comment comment = Comment.builder()
                .postId(postId)
                .userId(userId)
                .parentId(request.parentId())
                .content(request.content())
                .likesCount(0)
                .build();

        comment = commentRepository.save(comment);

        // Handle mentions
        List<UserDto> mentionedUsers = new ArrayList<>();
        if (request.mentions() != null && !request.mentions().isEmpty()) {
            for (UUID mentionedUserId : request.mentions()) {
                User mentionedUser = userRepository.findById(mentionedUserId).orElse(null);
                if (mentionedUser != null) {
                    CommentMention mention = CommentMention.builder()
                            .commentId(comment.getId())
                            .userId(mentionedUserId)
                            .build();
                    commentMentionRepository.save(mention);
                    mentionedUsers.add(mapUserToDto(mentionedUser));
                }
            }
        }

        // Increment post comments count
        post.setCommentsCount(post.getCommentsCount() + 1);
        postRepository.save(post);

        // TODO: Create notifications

        // Return DTO
        return mapToDto(comment, user, mentionedUsers, false, new ArrayList<>());
    }

    public PageResponse<CommentDto> getCommentsByPost(UUID postId, UUID currentUserId, int page, int limit) {
        Pageable pageable = PageRequest.of(page, limit);
        Page<Comment> commentsPage = commentRepository.findByPostIdOrderByCreatedAtAsc(postId, pageable);

        List<CommentDto> commentDtos = commentsPage.getContent().stream()
                .map(comment -> {
                    User author = userRepository.findById(comment.getUserId()).orElse(null);
                    boolean isLiked = currentUserId != null &&
                            commentLikeRepository.existsByUserIdAndCommentId(currentUserId, comment.getId());

                    // Get mentions
                    List<UserDto> mentions = commentMentionRepository.findByCommentId(comment.getId())
                            .stream()
                            .map(mention -> userRepository.findById(mention.getUserId()).orElse(null))
                            .filter(user -> user != null)
                            .map(this::mapUserToDto)
                            .collect(Collectors.toList());

                    // Get replies (nested comments)
                    List<CommentDto> replies = new ArrayList<>();
                    if (comment.getParentId() == null) {
                        replies = commentRepository.findByParentIdOrderByCreatedAtAsc(comment.getId())
                                .stream()
                                .map(reply -> {
                                    User replyAuthor = userRepository.findById(reply.getUserId()).orElse(null);
                                    boolean replyIsLiked = currentUserId != null &&
                                            commentLikeRepository.existsByUserIdAndCommentId(currentUserId, reply.getId());
                                    return mapToDto(reply, replyAuthor, new ArrayList<>(), replyIsLiked, new ArrayList<>());
                                })
                                .collect(Collectors.toList());
                    }

                    return mapToDto(comment, author, mentions, isLiked, replies);
                })
                .collect(Collectors.toList());

        return PageResponse.of(commentDtos, page, limit, commentsPage.getTotalElements());
    }

    @Transactional
    public void deleteComment(UUID commentId, UUID userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        // Check ownership
        if (!comment.getUserId().equals(userId)) {
            throw new IllegalArgumentException("You can only delete your own comments");
        }

        // Get post to decrement count
        Post post = postRepository.findById(comment.getPostId())
                .orElseThrow(() -> new IllegalArgumentException("Post not found"));

        // Delete comment (cascade will delete likes and mentions)
        commentRepository.delete(comment);

        // Decrement post comments count
        post.setCommentsCount(Math.max(0, post.getCommentsCount() - 1));
        postRepository.save(post);
    }

    @Transactional
    public void likeComment(UUID commentId, UUID userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (commentLikeRepository.existsByUserIdAndCommentId(userId, commentId)) {
            throw new IllegalArgumentException("Comment already liked");
        }

        CommentLike like = CommentLike.builder()
                .userId(userId)
                .commentId(commentId)
                .build();
        commentLikeRepository.save(like);

        comment.setLikesCount(comment.getLikesCount() + 1);
        commentRepository.save(comment);
    }

    @Transactional
    public void unlikeComment(UUID commentId, UUID userId) {
        Comment comment = commentRepository.findById(commentId)
                .orElseThrow(() -> new IllegalArgumentException("Comment not found"));

        if (!commentLikeRepository.existsByUserIdAndCommentId(userId, commentId)) {
            throw new IllegalArgumentException("Comment not liked");
        }

        commentLikeRepository.deleteByUserIdAndCommentId(userId, commentId);

        comment.setLikesCount(Math.max(0, comment.getLikesCount() - 1));
        commentRepository.save(comment);
    }

    private CommentDto mapToDto(Comment comment, User author, List<UserDto> mentions,
                                 boolean isLiked, List<CommentDto> replies) {
        UserDto authorDto = author != null ? mapUserToDto(author) : null;

        return new CommentDto(
                comment.getId(),
                authorDto,
                comment.getPostId(),
                comment.getParentId(),
                comment.getContent(),
                comment.getLikesCount(),
                isLiked,
                mentions,
                replies,
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }

    private UserDto mapUserToDto(User user) {
        return new UserDto(
                user.getId(),
                user.getPhone(),
                user.getNickname(),
                user.getAvatarUrl(),
                user.getBio(),
                user.getPostsCount(),
                user.getFollowersCount(),
                user.getFollowingCount()
        );
    }
}
```

**Step 5: Run test to verify it passes**

Run: `mvn test -Dtest=CommentServiceTests`
Expected: PASS - comment service methods work correctly

**Step 6: Commit**

```bash
git add src/main/java/com/allesgut/service/CommentService.java src/main/java/com/allesgut/dto/ src/test/java/com/allesgut/service/CommentServiceTests.java
git commit -m "feat: add CommentService with create, delete, like/unlike functionality"
```

---

## Task 18: Create/Delete Comment Endpoints

**Files:**
- Create: `src/main/java/com/allesgut/controller/CommentsController.java`
- Create: `src/test/java/com/allesgut/controller/CommentsControllerTests.java`

**Step 1: Write test for CommentsController**

Create: `src/test/java/com/allesgut/controller/CommentsControllerTests.java`

```java
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
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
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
    @WithMockUser
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
    @WithMockUser
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
                .andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser
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
    @WithMockUser
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
    @WithMockUser
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
    @WithMockUser
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
```

**Step 2: Run test to verify it fails**

Run: `mvn test -Dtest=CommentsControllerTests`
Expected: FAIL with "No mapping found"

**Step 3: Create CommentsController**

Create: `src/main/java/com/allesgut/controller/CommentsController.java`

```java
package com.allesgut.controller;

import com.allesgut.dto.request.CreateCommentRequest;
import com.allesgut.dto.response.ApiResponse;
import com.allesgut.dto.response.CommentDto;
import com.allesgut.dto.response.PageResponse;
import com.allesgut.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CommentsController {

    private final CommentService commentService;

    @PostMapping("/api/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<CommentDto>> createComment(
            @PathVariable UUID postId,
            @Valid @RequestBody CreateCommentRequest request,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        CommentDto comment = commentService.createComment(postId, userId, request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(comment));
    }

    @GetMapping("/api/posts/{postId}/comments")
    public ResponseEntity<ApiResponse<PageResponse<CommentDto>>> getCommentsByPost(
            @PathVariable UUID postId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit,
            Authentication authentication) {
        UUID currentUserId = authentication != null
                ? UUID.fromString(authentication.getName())
                : null;

        PageResponse<CommentDto> comments = commentService.getCommentsByPost(
                postId, currentUserId, page, limit);
        return ResponseEntity.ok(ApiResponse.success(comments));
    }

    @DeleteMapping("/api/comments/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteComment(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        commentService.deleteComment(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Comment deleted successfully"));
    }

    @PostMapping("/api/comments/{id}/like")
    public ResponseEntity<ApiResponse<Void>> likeComment(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        commentService.likeComment(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Comment liked"));
    }

    @DeleteMapping("/api/comments/{id}/like")
    public ResponseEntity<ApiResponse<Void>> unlikeComment(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        commentService.unlikeComment(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Comment unliked"));
    }
}
```

**Step 4: Run test to verify it passes**

Run: `mvn test -Dtest=CommentsControllerTests`
Expected: PASS - all comment endpoints work correctly

**Step 5: Commit**

```bash
git add src/main/java/com/allesgut/controller/CommentsController.java src/test/java/com/allesgut/controller/CommentsControllerTests.java
git commit -m "feat: add Comments REST API endpoints"
```

---

## Task 19: Nested Replies Support (Already Implemented)

The nested replies support is already implemented in Task 17's `CommentService`. The service:
- Accepts `parentId` in `CreateCommentRequest`
- Validates that parent comment exists and belongs to same post
- Fetches replies when getting comments using `findByParentIdOrderByCreatedAtAsc()`
- Returns nested structure with replies embedded in parent comments

**Additional Test for Nested Replies**

Add to: `src/test/java/com/allesgut/service/CommentServiceTests.java`

```java
@Test
void shouldGetNestedRepliesStructure() {
    // Given
    Comment parentComment = Comment.builder()
            .id(UUID.randomUUID())
            .postId(testPost.getId())
            .userId(testUser.getId())
            .content("Parent comment")
            .build();

    Comment replyComment = Comment.builder()
            .id(UUID.randomUUID())
            .postId(testPost.getId())
            .userId(testUser.getId())
            .parentId(parentComment.getId())
            .content("Reply comment")
            .build();

    Page<Comment> commentsPage = new PageImpl<>(List.of(parentComment));
    when(commentRepository.findByPostIdOrderByCreatedAtAsc(any(UUID.class), any(Pageable.class)))
            .thenReturn(commentsPage);
    when(commentRepository.findByParentIdOrderByCreatedAtAsc(parentComment.getId()))
            .thenReturn(List.of(replyComment));
    when(userRepository.findById(any(UUID.class))).thenReturn(Optional.of(testUser));

    // When
    PageResponse<CommentDto> result = commentService.getCommentsByPost(testPost.getId(), null, 0, 20);

    // Then
    assertThat(result.getData()).hasSize(1);
    assertThat(result.getData().get(0).replies()).hasSize(1);
    assertThat(result.getData().get(0).replies().get(0).content()).isEqualTo("Reply comment");
}
```

**Commit**

```bash
git add src/test/java/com/allesgut/service/CommentServiceTests.java
git commit -m "test: add test for nested comment replies structure"
```

---

## Task 20: Like Comment Endpoints (Already Implemented)

The like/unlike comment endpoints are already implemented in Task 18's `CommentsController`:
- `POST /api/comments/{id}/like` - Like comment
- `DELETE /api/comments/{id}/like` - Unlike comment

These endpoints use the `CommentService.likeComment()` and `CommentService.unlikeComment()` methods implemented in Task 17.

**Additional Integration Test**

Create: `src/test/java/com/allesgut/integration/CommentLikeIntegrationTests.java`

```java
package com.allesgut.integration;

import com.allesgut.dto.request.CreateCommentRequest;
import com.allesgut.dto.response.ApiResponse;
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
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CommentLikeIntegrationTests {


    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

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

        // Try to like again
        mockMvc.perform(post("/api/comments/{id}/like", commentId)
                        .header("Authorization", "Bearer " + authToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.success").value(false))
                .andExpect(jsonPath("$.message").value("Comment already liked"));
    }
}
```

**Commit**

```bash
git add src/test/java/com/allesgut/integration/CommentLikeIntegrationTests.java
git commit -m "test: add integration tests for comment like/unlike functionality"
```

---

## Summary

Tasks 16-20 complete the Comments System with:
- ✅ Database schema for comments, likes, and mentions
- ✅ Comment entities and repositories
- ✅ Comment service with create, delete, like/unlike
- ✅ Nested replies support
- ✅ REST API endpoints for all comment operations
- ✅ Comprehensive unit and integration tests

**Next:** Tasks 21-25 will implement the User Profile & Follow System.
