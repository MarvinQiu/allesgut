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
    private final NotificationService notificationService;

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
        Integer currentCommentsCount = post.getCommentsCount();
        post.setCommentsCount((currentCommentsCount != null ? currentCommentsCount : 0) + 1);
        postRepository.save(post);

        // Create notifications
        // 1. Notify post author if someone comments on their post (not own comment)
        if (request.parentId() == null && !post.getUserId().equals(userId)) {
            notificationService.createNotification(
                    post.getUserId(),
                    "comment",
                    userId,
                    comment.getId(),
                    user.getNickname() + " commented on your post"
            );
        }

        // 2. Notify parent comment author if someone replies (not own comment)
        if (request.parentId() != null) {
            Comment parentComment = commentRepository.findById(request.parentId()).orElse(null);
            if (parentComment != null && !parentComment.getUserId().equals(userId)) {
                notificationService.createNotification(
                        parentComment.getUserId(),
                        "comment",
                        userId,
                        comment.getId(),
                        user.getNickname() + " replied to your comment"
                );
            }
        }

        // 3. Notify mentioned users (not self-mentions)
        if (request.mentions() != null && !request.mentions().isEmpty()) {
            for (UUID mentionedUserId : request.mentions()) {
                if (!mentionedUserId.equals(userId)) {
                    notificationService.createNotification(
                            mentionedUserId,
                            "mention",
                            userId,
                            comment.getId(),
                            user.getNickname() + " mentioned you in a comment"
                    );
                }
            }
        }

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

        Integer currentLikesCount = comment.getLikesCount();
        comment.setLikesCount((currentLikesCount != null ? currentLikesCount : 0) + 1);
        commentRepository.save(comment);

        // Create notification if not liking own comment
        if (!comment.getUserId().equals(userId)) {
            User liker = userRepository.findById(userId).orElse(null);
            if (liker != null) {
                notificationService.createNotification(
                        comment.getUserId(),
                        "like",
                        userId,
                        commentId,
                        liker.getNickname() + " liked your comment"
                );
            }
        }
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
