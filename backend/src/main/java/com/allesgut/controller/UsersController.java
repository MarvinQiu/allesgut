package com.allesgut.controller;

import com.allesgut.dto.request.UpdateProfileRequest;
import com.allesgut.dto.response.ApiResponse;
import com.allesgut.dto.response.PageResponse;
import com.allesgut.dto.response.PostDto;
import com.allesgut.dto.response.UserDto;
import com.allesgut.service.PostService;
import com.allesgut.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UsersController {

    private final UserService userService;
    private final PostService postService;

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDto>> getUserProfile(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID currentUserId = authentication != null
                ? UUID.fromString(authentication.getName())
                : null;

        UserDto user = userService.getUserProfile(id, currentUserId);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PutMapping("/me")
    public ResponseEntity<ApiResponse<UserDto>> updateProfile(
            @Valid @RequestBody UpdateProfileRequest request,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        UserDto user = userService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PostMapping("/{id}/follow")
    public ResponseEntity<ApiResponse<Void>> followUser(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID followerId = UUID.fromString(authentication.getName());
        userService.followUser(followerId, id);
        return ResponseEntity.ok(ApiResponse.success("User followed successfully"));
    }

    @DeleteMapping("/{id}/follow")
    public ResponseEntity<ApiResponse<Void>> unfollowUser(
            @PathVariable UUID id,
            Authentication authentication) {
        UUID followerId = UUID.fromString(authentication.getName());
        userService.unfollowUser(followerId, id);
        return ResponseEntity.ok(ApiResponse.success("User unfollowed successfully"));
    }

    @GetMapping("/{id}/followers")
    public ResponseEntity<ApiResponse<PageResponse<UserDto>>> getFollowers(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit,
            Authentication authentication) {
        UUID currentUserId = authentication != null
                ? UUID.fromString(authentication.getName())
                : null;

        PageResponse<UserDto> followers = userService.getFollowers(id, currentUserId, page, limit);
        return ResponseEntity.ok(ApiResponse.success(followers));
    }

    @GetMapping("/{id}/following")
    public ResponseEntity<ApiResponse<PageResponse<UserDto>>> getFollowing(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit,
            Authentication authentication) {
        UUID currentUserId = authentication != null
                ? UUID.fromString(authentication.getName())
                : null;

        PageResponse<UserDto> following = userService.getFollowing(id, currentUserId, page, limit);
        return ResponseEntity.ok(ApiResponse.success(following));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<PageResponse<UserDto>>> searchUsers(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit) {

        if (q == null || q.trim().isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Search query is required"));
        }

        PageResponse<UserDto> users = userService.searchUsers(q, page, limit);
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{id}/posts")
    public ResponseEntity<ApiResponse<PageResponse<PostDto>>> getUserPosts(
            @PathVariable UUID id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int limit,
            Authentication authentication) {

        UUID currentUserId = authentication != null && authentication.isAuthenticated()
                ? UUID.fromString(authentication.getName())
                : null;

        PageResponse<PostDto> posts = postService.getUserPosts(id, currentUserId, page, limit);
        return ResponseEntity.ok(ApiResponse.success(posts));
    }
}
