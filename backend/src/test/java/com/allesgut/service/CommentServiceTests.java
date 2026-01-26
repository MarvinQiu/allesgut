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
}
