package com.allesgut.service;

import com.allesgut.dto.request.CreatePostRequest;
import com.allesgut.dto.response.PageResponse;
import com.allesgut.dto.response.PostDto;
import com.allesgut.dto.response.UserDto;
import com.allesgut.entity.*;
import com.allesgut.entity.UserFollow;
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

@Service
@RequiredArgsConstructor
public class PostService {

    private final PostRepository postRepository;
    private final TagRepository tagRepository;
    private final UserRepository userRepository;
    private final UserFollowRepository userFollowRepository;
    private final PostLikeRepository postLikeRepository;
    private final PostFavoriteRepository postFavoriteRepository;
    private final NotificationService notificationService;

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
        Integer currentPostsCount = user.getPostsCount();
        user.setPostsCount((currentPostsCount != null ? currentPostsCount : 0) + 1);
        userRepository.save(user);

        // Return DTO
        return mapToDto(post, user, tagNames, false, false);
    }

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

    public PageResponse<PostDto> getUserPosts(UUID userId, UUID currentUserId, int page, int limit) {
        Pageable pageable = PageRequest.of(page, limit);
        Page<Post> postsPage = postRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);

        User author = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<PostDto> postDtos = postsPage.getContent().stream()
                .map(post -> {
                    boolean isLiked = currentUserId != null &&
                            postLikeRepository.existsByUserIdAndPostId(currentUserId, post.getId());
                    boolean isFavorited = currentUserId != null &&
                            postFavoriteRepository.existsByUserIdAndPostId(currentUserId, post.getId());

                    return mapToDto(post, author, List.of(), isLiked, isFavorited);
                })
                .toList();

        return PageResponse.of(postDtos, page, limit, postsPage.getTotalElements());
    }

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
        Integer currentLikesCount = post.getLikesCount();
        post.setLikesCount((currentLikesCount != null ? currentLikesCount : 0) + 1);
        postRepository.save(post);

        // Create notification if not liking own post
        if (!post.getUserId().equals(userId)) {
            User liker = userRepository.findById(userId).orElse(null);
            if (liker != null) {
                notificationService.createNotification(
                        post.getUserId(),
                        "like",
                        userId,
                        postId,
                        liker.getNickname() + " liked your post"
                );
            }
        }
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

        Integer currentFavoritesCount = post.getFavoritesCount();
        post.setFavoritesCount((currentFavoritesCount != null ? currentFavoritesCount : 0) + 1);
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
