package com.allesgut.service;

import com.allesgut.dto.request.UpdateProfileRequest;
import com.allesgut.dto.response.PageResponse;
import com.allesgut.dto.response.UserDto;
import com.allesgut.entity.User;
import com.allesgut.entity.UserFollow;
import com.allesgut.repository.UserFollowRepository;
import com.allesgut.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserFollowRepository userFollowRepository;
    private final NotificationService notificationService;

    @Transactional(readOnly = true)
    public UserDto getUserProfile(UUID userId, UUID currentUserId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        return mapToDto(user);
    }

    @Transactional
    public UserDto updateProfile(UUID userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        // Validate nickname
        if (request.nickname() != null) {
            String nickname = request.nickname().trim();
            if (nickname.isEmpty() || nickname.length() > 50) {
                throw new IllegalArgumentException("Nickname must be between 1 and 50 characters");
            }
            user.setNickname(nickname);
        }

        // Validate and update avatar URL
        if (request.avatarUrl() != null) {
            user.setAvatarUrl(request.avatarUrl());
        }

        // Validate and update bio
        if (request.bio() != null) {
            if (request.bio().length() > 200) {
                throw new IllegalArgumentException("Bio must not exceed 200 characters");
            }
            user.setBio(request.bio());
        }

        user = userRepository.save(user);
        return mapToDto(user);
    }

    @Transactional
    public void followUser(UUID followerId, UUID followingId) {
        // Validate not following self
        if (followerId.equals(followingId)) {
            throw new IllegalArgumentException("Cannot follow yourself");
        }

        // Check if already following
        if (userFollowRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            throw new IllegalArgumentException("Already following this user");
        }

        // Get both users
        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new IllegalArgumentException("Follower user not found"));
        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new IllegalArgumentException("Following user not found"));

        // Create follow relationship
        UserFollow userFollow = UserFollow.builder()
                .followerId(followerId)
                .followingId(followingId)
                .build();
        userFollowRepository.save(userFollow);

        // Update counts
        Integer followerFollowingCount = follower.getFollowingCount();
        follower.setFollowingCount((followerFollowingCount != null ? followerFollowingCount : 0) + 1);

        Integer followingFollowersCount = following.getFollowersCount();
        following.setFollowersCount((followingFollowersCount != null ? followingFollowersCount : 0) + 1);

        userRepository.save(follower);
        userRepository.save(following);

        // Create notification for followed user
        notificationService.createNotification(
                followingId,
                "follow",
                followerId,
                null,
                follower.getNickname() + " started following you"
        );
    }

    @Transactional
    public void unfollowUser(UUID followerId, UUID followingId) {
        // Check if following
        if (!userFollowRepository.existsByFollowerIdAndFollowingId(followerId, followingId)) {
            throw new IllegalArgumentException("Not following this user");
        }

        // Get both users
        User follower = userRepository.findById(followerId)
                .orElseThrow(() -> new IllegalArgumentException("Follower user not found"));
        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new IllegalArgumentException("Following user not found"));

        // Delete follow relationship
        userFollowRepository.deleteByFollowerIdAndFollowingId(followerId, followingId);

        // Update counts
        follower.setFollowingCount(Math.max(0, follower.getFollowingCount() - 1));
        following.setFollowersCount(Math.max(0, following.getFollowersCount() - 1));

        userRepository.save(follower);
        userRepository.save(following);
    }

    @Transactional(readOnly = true)
    public PageResponse<UserDto> getFollowers(UUID userId, UUID currentUserId, int page, int limit) {
        Pageable pageable = PageRequest.of(page, limit);
        Page<UserFollow> followsPage = userFollowRepository.findByFollowingId(userId, pageable);

        List<UserDto> followers = followsPage.getContent().stream()
                .map(follow -> {
                    User follower = userRepository.findById(follow.getFollowerId()).orElse(null);
                    if (follower == null) return null;
                    return mapToDto(follower);
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());

        return PageResponse.of(followers, page, limit, followsPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PageResponse<UserDto> getFollowing(UUID userId, UUID currentUserId, int page, int limit) {
        Pageable pageable = PageRequest.of(page, limit);
        Page<UserFollow> followsPage = userFollowRepository.findByFollowerId(userId, pageable);

        List<UserDto> following = followsPage.getContent().stream()
                .map(follow -> {
                    User followingUser = userRepository.findById(follow.getFollowingId()).orElse(null);
                    if (followingUser == null) return null;
                    return mapToDto(followingUser);
                })
                .filter(dto -> dto != null)
                .collect(Collectors.toList());

        return PageResponse.of(following, page, limit, followsPage.getTotalElements());
    }

    @Transactional(readOnly = true)
    public PageResponse<UserDto> searchUsers(String query, int page, int limit) {
        // Validate query
        if (query == null || query.trim().isEmpty()) {
            throw new IllegalArgumentException("Search query cannot be empty");
        }

        String trimmedQuery = query.trim();
        if (trimmedQuery.length() < 2) {
            throw new IllegalArgumentException("Search query must be at least 2 characters");
        }

        Pageable pageable = PageRequest.of(page, limit);
        Page<User> usersPage = userRepository.findByNicknameContainingIgnoreCase(trimmedQuery, pageable);

        List<UserDto> users = usersPage.getContent().stream()
                .map(this::mapToDto)
                .collect(Collectors.toList());

        return PageResponse.of(users, page, limit, usersPage.getTotalElements());
    }

    private UserDto mapToDto(User user) {
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
