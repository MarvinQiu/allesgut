package com.allesgut.service;

import com.allesgut.dto.request.CreatePostRequest;
import com.allesgut.dto.response.PageResponse;
import com.allesgut.dto.response.PostDto;
import com.allesgut.entity.Post;
import com.allesgut.entity.Tag;
import com.allesgut.entity.User;
import com.allesgut.repository.*;
import com.allesgut.entity.UserFollow;
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

    @Mock
    private UserFollowRepository userFollowRepository;

    @Mock
    private PostLikeRepository postLikeRepository;

    @Mock
    private PostFavoriteRepository postFavoriteRepository;

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
        verify(postLikeRepository).save(any());
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
        verify(postFavoriteRepository).save(any());
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
}
